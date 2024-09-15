import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import 'express-async-errors';
import type { Request, Response, NextFunction } from 'express';
import createHTTPError from 'http-errors';
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

function errorHandler(err: Error | createHTTPError.HttpError, req: Request, res: Response, next: NextFunction) {
    const status = (err instanceof createHTTPError.HttpError) ? err.statusCode : 500;
    const isServerError = status >= 500;
    const message = err.message;
    const data = (err as createHTTPError.HttpError).data || { err };
    const output = {
        message,
        ...data
    };
    if (isServerError) console.error(`Error while handling ${req.path}: ${message}`);
    res.status(status).json(output);
    next();
}

const authKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('X-API-KEY');
    const validKey = process.env.AUTHORIZED_KEY!;

    if (key === validKey) {
        next();
    } else {
        throw new createHTTPError.Unauthorized();
    }
};

app.use(cors());
app.use(express.json());
app.use(authKeyMiddleware);

app.get('/', async (req, res) => {
    res.send('bye world :(');
});

app.get('/api/users/:user', async (req, res) => {
    let { user } = req.params;
    let result = await db.collection('users').findOne({ _id: ObjectId.createFromHexString(user) });
    if (result === null) throw new createHTTPError.NotFound();
    res.json({ status: 'ok', user: result });
});

app.patch('/api/users/:user', async (req, res) => {
    let { user } = req.params;

    let result = await db.collection('users').updateOne(
        { _id: ObjectId.createFromHexString(user) },
        { $set: req.body }
    );
    if (result === null) throw new createHTTPError.NotFound();
    res.json({ status: 'ok' });
});

app.post('/api/users', async (req, res) => {
    const newUser = User.parse(req.body);
    let result = await db.collection('users').insertOne(newUser);
    if (!result.acknowledged) throw new createHTTPError.InternalServerError();
    res.json({ status: 'ok', id: result.insertedId.toString() })
});

app.post('/api/users/:user/assignments', async (req, res) => {
    let { user } = req.params;

    let assignment = Assignment.parse(req.body);

    let result = await db.collection('users').updateOne(
        { _id: ObjectId.createFromHexString(user) },
        { $push: { assignments: assignment } }
    );
    if (!result.acknowledged) throw new createHTTPError.InternalServerError();
    res.json({ status: 'ok' });
});

app.delete('/api/users/:user/assignments', async (req, res) => {
    let { user } = req.params;

    let result = await db.collection('users').updateOne(
        { _id: ObjectId.createFromHexString(user) },
        { $set: { assignments: [] } }
    );
    if (!result.acknowledged) throw new createHTTPError.InternalServerError();
    res.json({ status: 'ok' });
});

app.use(zodErrorHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
