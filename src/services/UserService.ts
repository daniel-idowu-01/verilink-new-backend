import logger from "../utils/logger";
import { User } from "../models/User";
import { NotFoundError } from "../utils/errors";

export class UserService {
  constructor() {}

  async createUser(userData: any): Promise<any> {
    try {
      const user = await User.create(userData);
      logger.info("User created successfully: " + user._id);
      return user;
    } catch (error) {
      logger.error("Error creating user: " + error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.warn("User not found: " + userId);
        throw new NotFoundError("User not found");
      }
      logger.info("User retrieved successfully: " + user._id);
      return user;
    } catch (error) {
      logger.error("Error retrieving user: " + error);
      throw error;
    }
  }

  async getUserByEmail(email: string, signUp: boolean): Promise<any> {
    try {
      const user = await User.findOne({ email });
      if (!user && !signUp) {
        logger.warn("User not found: " + email);
        throw new NotFoundError("User not found");
      }
      logger.info("User retrieved successfully: " + (user ? user._id : 'not found'));
      return user;
    } catch (error) {
      logger.error("Error retrieving user: " + error);
      throw error;
    }
  }

  async updateUserById(userId: string, updateData: any): Promise<any> {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      if (!user) {
        logger.warn("User not found for update: " + userId);
        throw new NotFoundError("User not found");
      }
    } catch (error) {
      logger.error("Error updating user: " + error);
      throw error;
    }
  }

  async deleteUserById(userId: string): Promise<void> {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        logger.warn("User not found for deletion: " + userId);
        throw new NotFoundError("User not found");
      }
      logger.info("User deleted successfully: " + user._id);
    } catch (error) {
      logger.error("Error deleting user: " + error);
      throw error;
    }
  }
}
