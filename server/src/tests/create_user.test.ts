
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  role: 'reader',
  display_name: 'Test User'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_testpassword123');
    expect(result.role).toEqual('reader');
    expect(result.display_name).toEqual('Test User');
    expect(result.coin_balance).toEqual(0);
    expect(typeof result.coin_balance).toEqual('number');
    expect(result.is_active).toEqual(true);
    expect(result.email_verified).toEqual(false);
    expect(result.two_factor_enabled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal fields (using defaults)', async () => {
    const minimalInput: CreateUserInput = {
      username: 'minimaluser',
      email: 'minimal@example.com',
      password: 'password123',
      role: 'reader'
    };

    const result = await createUser(minimalInput);

    expect(result.username).toEqual('minimaluser');
    expect(result.email).toEqual('minimal@example.com');
    expect(result.role).toEqual('reader');
    expect(result.display_name).toBeNull();
    expect(result.coin_balance).toEqual(0);
    expect(result.is_active).toEqual(true);
    expect(result.email_verified).toEqual(false);
    expect(result.two_factor_enabled).toEqual(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual('hashed_testpassword123');
    expect(users[0].role).toEqual('reader');
    expect(users[0].display_name).toEqual('Test User');
    expect(parseFloat(users[0].coin_balance)).toEqual(0);
    expect(users[0].is_active).toEqual(true);
    expect(users[0].email_verified).toEqual(false);
    expect(users[0].two_factor_enabled).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user with writer role', async () => {
    const writerInput: CreateUserInput = {
      username: 'writer123',
      email: 'writer@example.com',
      password: 'writerpass123',
      role: 'writer',
      display_name: 'Writer User'
    };

    const result = await createUser(writerInput);

    expect(result.role).toEqual('writer');
    expect(result.username).toEqual('writer123');
    expect(result.email).toEqual('writer@example.com');
    expect(result.display_name).toEqual('Writer User');
  });

  it('should create user with admin role', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin123',
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'admin'
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.username).toEqual('admin123');
    expect(result.email).toEqual('admin@example.com');
    expect(result.display_name).toBeNull();
  });
});
