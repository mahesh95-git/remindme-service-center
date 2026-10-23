import { Request, Response, NextFunction } from 'express';
import {
  getUsersService,
  createUserService,
  updateUserService,
  deleteUserService,
} from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await getUsersService();
    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await createUserService(req.body);
    return sendSuccess(res, user, 'Staff member created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await updateUserService(id, req.body);
    return sendSuccess(res, user, 'Staff member updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await deleteUserService(id, req.user!.id);
    return sendSuccess(res, result, 'Staff member deleted successfully');
  } catch (err) {
    next(err);
  }
}
