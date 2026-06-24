import { Request } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { GraphQLContext, IUser } from '../types';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export const getContextFromRequest = async (req: Request): Promise<GraphQLContext> => {
  let user: IUser | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const found = await User.findById(decoded.id).select('-password');
      if (found) user = found;
    } catch {
      // invalid token — user stays undefined (guest)
    }
  }

  return { user, req };
};

// Guard helpers used inside resolvers
export const requireAuth = (context: GraphQLContext): IUser => {
  if (!context.user) throw new AuthenticationError('You must be logged in');
  if (context.user.status === 'banned') throw new ForbiddenError('Account banned');
  if (context.user.status === 'suspended') throw new ForbiddenError('Account suspended');
  return context.user;
};

export const requireRole = (context: GraphQLContext, ...roles: string[]): IUser => {
  const user = requireAuth(context);
  if (!roles.includes(user.role)) throw new ForbiddenError(`Role '${user.role}' not authorized`);
  return user;
};