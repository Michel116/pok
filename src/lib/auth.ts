
// This file is currently not used but can be expanded for server-side authentication if needed.
import bcrypt from 'bcryptjs';
import { users } from './mock-data';

export async function authenticateUser(username: string, password: string): Promise<any | null> {
  const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
  if (!user || !user.passwordHash) {
    return null;
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (match) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}
