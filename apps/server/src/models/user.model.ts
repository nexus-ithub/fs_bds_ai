import { db } from '../utils/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { AdditionalInfo } from "@repo/common";
import axios from 'axios';

export interface User extends RowDataPacket {
  id?: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  profile?: string;
  provider?: string;
  socialId?: string;
  marketingEmail?: string;
  marketingSms?: string;
  deleteYn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE email = ? ',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  }

  static async checkEmail(email: string): Promise<boolean> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE email = ? ',
        [email]
      );
      return users[0] ? true : false;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error; 
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT * FROM users WHERE id = ? AND delete_yn = "N"',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async findByNamePhone(name: string, phone: string): Promise<User[] | null>{
    try {
      const user = await db.query<User>(
        'SELECT email, provider FROM users WHERE name = ? AND phone = ? AND delete_yn = "N"',
        [name, phone]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user by name and phone:', error);
      throw error;
    }
  }

  static async userInfoById(id: number): Promise<User | null> {
    try {
      const users = await db.query<User>(
        'SELECT id, email, name, phone, profile, provider FROM users WHERE id = ? AND delete_yn = "N"',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }  

  static async create (user: User): Promise<User> {
    try {
      const salt = bcrypt.genSaltSync(8);
      const hashedPassword = bcrypt.hashSync(String(user.password), salt);
      const result = await db.query(
        `
        INSERT INTO users (email, password, name, phone, profile, provider, social_id, marketing_email, marketing_sms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          name = VALUES(name),
          phone = VALUES(phone),
          profile = VALUES(profile),
          provider = VALUES(provider),
          social_id = VALUES(social_id), 
          marketing_email = VALUES(marketing_email),
          marketing_sms = VALUES(marketing_sms)
        `,
        [user.email, hashedPassword, user.name, user.phone, user.profile, user.provider, user.socialId, user.marketingEmail, user.marketingSms]
      );

      const newUser: User = {
        ...user,
        id: (result as any).insertId,
      };
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update (user: User): Promise<void> {
    console.log('user:', user);
    try {
      await db.query<User>(
        'UPDATE users SET password = ?, name = ?, phone = ?, profile = ?, provider = ?, social_id = ? WHERE id = ? AND delete_yn = "N"',
        [user.password, user.name, user.phone, user.profile, user.provider, user.socialId, user.id]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async updatePassword (id: number, password: string): Promise<void> {
    const salt = bcrypt.genSaltSync(8);
    const hashedPassword = bcrypt.hashSync(String(password), salt);
    try {
      await db.query<User>(
        'UPDATE users SET password = ? WHERE id = ? AND delete_yn = "N"',
        [hashedPassword, id]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async confirmPassword (id: number, password: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return false;
      }
      return bcrypt.compareSync(String(password), user.password);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  }

  static async deleteAccount (id: number): Promise<boolean> {
    try {
      const userInfo = await db.query<User>(
        'SELECT provider, social_id FROM users WHERE id = ? AND delete_yn = "N"',
        [id]
      )
      if (userInfo[0].provider === "k") {
        const res = await axios.post(
          "https://kapi.kakao.com/v1/user/unlink",
          null,
          {
            params: {
              target_id_type: "user_id",
              target_id: userInfo[0].social_id
            },
            headers: {
              Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
            },
          }
        )
      }
      await db.query<User>(
        'UPDATE users SET delete_yn = ?, email = ?, password = ?, name = ?, phone = ?, profile = ?, provider = ?, social_id = ? WHERE id = ? AND delete_yn = "N"',
        ["Y", `${id}@delete.com`, "-", "-", "-", "-", "-", "-", id]
      ); 
      await db.query(
        'UPDATE users_info SET delete_yn = ? WHERE user_id = ? AND delete_yn = "N"',
        ["Y", id]
      )
      await db.query(
        'UPDATE users_info_multi SET delete_yn = ? WHERE user_id = ? AND delete_yn = "N"',
        ["Y", id]
      )
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getAdditionalInfo (id: number): Promise<AdditionalInfo | null> {
    try {
      const userInfo = await db.query<AdditionalInfo>(
        `SELECT gender, age FROM users_info WHERE user_id = ? AND delete_yn = 'N'`,
        [id]
      );
      const userInfoMulti = await db.query<{item_type: string, item_id: number}[]>(
        `SELECT item_type, item_id FROM users_info_multi WHERE user_id = ? AND delete_yn = 'N'`,
        [id]
      ) as [{ item_type: string; item_id: number }[], any];
      const interests = userInfoMulti
        .filter(obj => obj.item_type === 'INTEREST')
        .map(obj => obj.item_id);
      const result: AdditionalInfo = {
        ...userInfo[0],
        interests,
      };
      console.log(result)
      return result || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async insertAdditionalInfo (userId: number, gender: string, age: number, interests: string[]): Promise<void> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (gender || age) {
        await connection.query(`UPDATE users_info SET delete_yn = 'Y' WHERE user_id = ?`, [userId])
        await connection.query(
          'INSERT INTO users_info (user_id, gender, age) VALUES (?, ?, ?)',
          [userId, gender, age]
        );
      }

      await connection.query(`UPDATE users_info_multi SET delete_yn = 'Y' WHERE user_id = ?`, [userId])
      if (interests.length > 0) {
        const values = interests.map(id => [userId, 'INTEREST', id]);
        await connection.query(
          'INSERT INTO users_info_multi (user_id, item_type, item_id) VALUES ?',
          [values]
        );
      }
      await connection.commit();
    } catch (error) {
      console.error('Error inserting additional info:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
