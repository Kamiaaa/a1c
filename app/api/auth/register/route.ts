import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

/**
 * First-run setup only: while the database has NO staff accounts, this creates the first admin.
 * Once any staff account exists, public registration is closed (admins create further staff
 * from Dashboard -> User Management, and customers are created from Dashboard -> Customers).
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    if ((await User.estimatedDocumentCount()) > 0) {
      return NextResponse.json(
        { error: 'Registration is closed. Ask an administrator to create your account.' },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role: 'admin' });

    return NextResponse.json(
      { message: 'Administrator account created. You can now sign in.', userId: newUser._id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
