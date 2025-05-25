import { Schema, Document } from "mongoose";

export interface IAuditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export const auditableSchema = new Schema<IAuditable>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    version: { type: Number, default: 1 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware for version control
auditableSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});
