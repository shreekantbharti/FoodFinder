import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // ────────── Auth fields ──────────
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  resetOTP: {
    type: String,
    default: ''
  },
  resetOTPExpiredAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user'
  },
  // ────────── Vendor (optional) ──────────
  stallName: {
    type: String
  },
  foodType: {
    type: String
  },
  city: {
    type: String
  },
  phoneNumber: {
    type: String
  },
 
   location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
    
});

UserSchema.index({ location: '2dsphere' });

export const UserModel = mongoose.model('User', UserSchema);
