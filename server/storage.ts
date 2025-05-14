import { log } from "./vite";

/**
 * User interface
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  organizationId?: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

/**
 * Insert user data interface
 */
export interface InsertUser {
  username: string;
  email: string;
  role: string;
  organizationId?: number;
  [key: string]: any;
}

/**
 * Storage interface for data persistence
 */
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

/**
 * In-memory storage implementation
 */
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    log('In-memory storage initialized', 'storage');
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, user);
    log(`User created: ${user.email}`, 'storage');
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    log(`User updated: ${updatedUser.email}`, 'storage');
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = this.users.delete(id);
    if (result) {
      log(`User deleted: ID ${id}`, 'storage');
    }
    return result;
  }
}

// Export a singleton instance of the storage
export const storage = new MemStorage();
