import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs';
import { AdminModel } from '../../../models/admin.model';

const handler = NextAuth({
  providers: [
    // ID, PW 로그인 방식
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
            email: { label: 'Email', type: 'text' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Missing credentials');
          }
          const user = await AdminModel.findByEmail(credentials.email);
          if (!user) throw new Error('Invalid credentials');

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) throw new Error('Invalid credentials');
          
          return { id: user.id, email: user.email, name: user.name };
        }
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }