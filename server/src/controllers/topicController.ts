import { Request, Response } from 'express';

const topics = [
    { id: 1, name: 'Fashion and Clothing' },
    { id: 2, name: 'Education' },
    { id: 3, name: 'Environment' },
    { id: 4, name: 'Technology' },
    { id: 5, name: 'Family' }
];

export const getTopics = (req: Request, res: Response) => {
    res.json(topics);
};

export const getTopicDetails = (req: Request, res: Response) => {
    const topic = topics.find(t => t.id === parseInt(req.params.id));
    if (!topic) {
        return res.status(404).json({ msg: 'Topic not found' });
    }
    res.json(topic);
};
