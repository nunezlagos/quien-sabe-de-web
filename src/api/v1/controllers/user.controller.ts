import type { APIContext } from 'astro';
import { getUsersService } from '../../../lib/services/users.service';
import { successResponse, errorResponse } from '../../../lib/utils/response';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role: z.enum(['user', 'provider', 'admin']).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateUserSchema = createUserSchema.partial();

export const listUsers = async (ctx: APIContext) => {
  try {
    const service = getUsersService(ctx);
    const allUsers = await service.getAllUsers();
    return successResponse(allUsers);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
};

export const getUser = async (ctx: APIContext) => {
  try {
    const { id } = ctx.params;
    
    if (!id || isNaN(Number(id))) {
      return errorResponse('Invalid user ID', 400);
    }

    const service = getUsersService(ctx);
    const user = await service.getUserById(Number(id));

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
};

export const createUser = async (ctx: APIContext) => {
  try {
    const service = getUsersService(ctx);
    const body = await ctx.request.json();
    
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
        const errorMessages = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return errorResponse(errorMessages, 400);
    }

    const createdUser = await service.createUser(result.data);
    return successResponse(createdUser, 201);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
        return errorResponse('Email already registered', 409);
    }
    return errorResponse(error.message, 500);
  }
};

export const updateUser = async (ctx: APIContext) => {
  try {
    const { id } = ctx.params;
    if (!id || isNaN(Number(id))) {
      return errorResponse('Invalid user ID', 400);
    }

    const service = getUsersService(ctx);
    const body = await ctx.request.json();

    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return errorResponse(errorMessages, 400);
    }

    const updatedUser = await service.updateUser(Number(id), result.data);
    if (!updatedUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse(updatedUser);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return errorResponse('Email already registered', 409);
    }
    return errorResponse(error.message, 500);
  }
};

export const deleteUser = async (ctx: APIContext) => {
  try {
    const { id } = ctx.params;
    if (!id || isNaN(Number(id))) {
      return errorResponse('Invalid user ID', 400);
    }

    const service = getUsersService(ctx);
    const deletedUser = await service.deleteUser(Number(id));

    if (!deletedUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ message: 'User deleted successfully', deletedUser });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
};
