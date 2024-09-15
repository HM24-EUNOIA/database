import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import 'express-async-errors';
import type { Request, Response, NextFunction } from 'express';
import { HttpError, createHTTPError } from 'http-errors';
import { Assignment, User } from './models';
import { db } from './mongo';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';

const app = express();
const port = 3000;

function zodErrorHandler(err: ZodError, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof ZodError)) {
        next(err);
        return;
    }
    res.status(400).json({
        message: 'Invalid Request Body',
        errors: err.errors
    });
}

function errorHandler(err: Error | HttpError, req: Request, res: Response, next: NextFunction) {
    const status = (err instanceof HttpError) ? err.statusCode : 500;
    const isServerError = status >= 500;
    const message = err.message;
    const data = (err as HttpError).data || { err };
    const output = {
        message,
        ...data
    };
    if (isServerError) console.error(`Error while handling ${req.path}: ${message}`);
    res.status(status).json(output);
    next();
}

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.send('bye world :(');
});

app.post('/api/users', async (req, res) => {
    const newUser = User.parse(req.body);
    let result = await db.collection('users').insertOne(newUser);
    if (!result.acknowledged) throw new createHTTPError.internalServerError();
    res.json({ status: 'ok', id: result.insertedId.toString() })
});

app.post('/api/users/:user/assignments', async (req, res) => {
    let { user } = req.params;

    let assignment = Assignment.parse(req.body);

    let result = await db.collection('users').updateOne(
        { _id: ObjectId.createFromHexString(user) },
        { $push: { assignments: assignment } }
    );
    if (!result.acknowledged) throw new createHTTPError.internalServerError();
    res.json({ status: 'ok' });
});

app.use(zodErrorHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

