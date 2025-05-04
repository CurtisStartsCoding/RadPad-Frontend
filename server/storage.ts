import { users, type User, type InsertUser, type OrgUser } from "@shared/schema";

export interface IStorage {
  // User authentication and management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  
  // Organization users management
  getOrganizationUsers(): Promise<User[]>;
  createOrganizationUser(user: OrgUser): Promise<User>;
  bulkCreateOrganizationUsers(users: OrgUser[]): Promise<User[]>;
  
  // Session store for auth
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = {}; // For simplicity, we're not implementing a real session store here
    
    // Pre-populate with an admin user
    this.createUser({
      username: "admin",
      password: "17d94b856f0e831178f637a21f60b61c589af0fb2066f029702c862349d4dc63e46902d493f56a7ce31163afa3dc3a370c949c58a4a0b82edb4a97e0f220c7f5.d1934aa44f92c6e3bd34c8b6da915587", // 'admin123'
      firstName: "System",
      lastName: "Administrator",
      email: "admin@radorderpad.com",
      role: "super_admin"
    }).then(user => {
      console.log("Admin user created:", user.username);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      lastLogin: new Date().toISOString() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getOrganizationUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role !== "super_admin"
    );
  }
  
  async createOrganizationUser(orgUser: OrgUser): Promise<User> {
    // Generate a temporary username and password for the user
    const username = `${orgUser.firstName.toLowerCase()}.${orgUser.lastName.toLowerCase()}${this.currentId}`;
    const temporaryPassword = "temp" + Math.random().toString(36).substring(2, 10);
    
    return this.createUser({
      ...orgUser,
      username,
      password: temporaryPassword,
      invitationStatus: "pending"
    });
  }
  
  async bulkCreateOrganizationUsers(orgUsers: OrgUser[]): Promise<User[]> {
    const createdUsers = [];
    for (const orgUser of orgUsers) {
      const user = await this.createOrganizationUser(orgUser);
      createdUsers.push(user);
    }
    return createdUsers;
  }
}

export const storage = new MemStorage();
