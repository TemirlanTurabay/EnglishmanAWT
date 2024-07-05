import { Request, Response } from 'express';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import User, { IUser } from '../models/User';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const createKTP = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { topic } = req.body;

    console.log('User ID:', userId);
    console.log('Topic:', topic);
    console.log('OPENAI_API_KEY:', OPENAI_API_KEY);

    if (!OPENAI_API_KEY) {
        console.error('Missing OpenAI API key');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!topic || topic.trim() === "") {
        return res.status(400).json({ error: 'Topic is required to create KTP.' });
    }

    try {
        const user: IUser | null = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const prompt = `Create a full KTP (календарно тематический план), on subject of English on theme of ${topic}, implementing exercises that develop understanding of cultural differences around the world, on the basis of methodics Finnish educational system, and provide links to the sources at the end.`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1024,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('OpenAI response:', response.data);

        const ktpContent = response.data.choices[0].message.content;

        const doc = new PDFDocument();
        const fileName = `ktp_${Date.now()}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Начало создания PDF
        doc.fontSize(16).text('Knowledge Transfer Plan (KTP)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Topic: ${topic}`, { align: 'left' });
        doc.moveDown();

        // Разделение контента на секции
        const sections: string[] = ktpContent.split('\n\n');
        sections.forEach((section: string) => {
            doc.fontSize(12).text(section, { align: 'left' });
            doc.moveDown();
        });

        // Пример таблицы
        doc.fontSize(14).text('Example Table', { align: 'left' });
        doc.moveDown();

        const tableTop = doc.y;
        const tableData = [
            ['Header 1', 'Header 2', 'Header 3'],
            ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
            ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
        ];

        const tableColumnWidths = [150, 150, 150];

        tableData.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                doc.text(cell, tableColumnWidths.slice(0, cellIndex).reduce((acc, width) => acc + width, 0) + 50, tableTop + (rowIndex * 20), {
                    width: tableColumnWidths[cellIndex],
                    align: 'left',
                });
            });
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.end();
    } catch (error: any) {
        console.error('Error processing request:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }
        res.status(500).json({ error: 'Failed to create KTP' });
    }
};
