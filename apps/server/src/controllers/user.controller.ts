import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

