import express from "express";
import axios from "axios";
import {
  register,
  login,
  logout,
  verifyOtpChangePassword,
  verifyEmailChangePassword,
  resetNewPassword,
} from "../controllers/auth.controller.js"; // ✅ MUST include .js

import { UserAuthMiddleware } from "../middlewares/auth.middleware.js";
import { UserModel } from "../Models/User.models.js";

const authrouter = express.Router();

authrouter.post("/register", register);
authrouter.post("/login", login);
authrouter.post("/logout", logout);

// updated
authrouter.post("/verify-Email-ChangePassword", verifyEmailChangePassword);

authrouter.post(
  "/verify-OTP-changePassword",
  UserAuthMiddleware,
  verifyOtpChangePassword
);

authrouter.post("/reset-password", UserAuthMiddleware, resetNewPassword);

// Change user role to vendor
authrouter.put("/upgrade-to-vendor", UserAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.role = "vendor";
    await user.save();

    res.json({
      success: true,
      message: "Successfully upgraded to vendor",
      user: { name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Role upgrade error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Vendor details update endpoint
authrouter.put("/vendor", UserAuthMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      stallName,
      foodType,
      city,
      phoneNumber,
      latitude,
      longitude,
    } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== "vendor") {
      return res
        .status(400)
        .json({ success: false, message: "User is not a vendor" });
    }

    // Update vendor details
    user.stallName = stallName || businessName;
    user.foodType = foodType;
    user.city = city;
    user.phoneNumber = phoneNumber;

    // Update location if provided
    if (latitude && longitude) {
      user.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Vendor details updated successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        stallName: user.stallName,
        foodType: user.foodType,
        city: user.city,
        phoneNumber: user.phoneNumber,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Vendor update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Google Maps API integration endpoints

// Get location details from coordinates
authrouter.get("/location/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    console.log(
      `Geocoding request: lat=${lat}, lng=${lng}, apiKey=${
        apiKey ? "present" : "missing"
      }`
    );

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    console.log("Google Maps API response status:", response.data.status);

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const result = response.data.results[0];
      res.json({
        success: true,
        location: {
          formatted_address: result.formatted_address,
          components: result.address_components,
          place_id: result.place_id,
        },
      });
    } else {
      console.log("Google Maps API error:", response.data);
      res
        .status(404)
        .json({
          success: false,
          message: "Location not found",
          details: response.data,
        });
    }
  } catch (error) {
    console.error("Geocoding error:", error.response?.data || error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Geocoding failed",
        error: error.message,
      });
  }
});

// Search places using Google Places API
authrouter.get("/places/search", async (req, res) => {
  try {
    const { query, lat, lng, radius = 5000 } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=${radius}`;
    }

    const response = await axios.get(url);

    if (response.data.status === "OK") {
      res.json({
        success: true,
        places: response.data.results.map((place) => ({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          types: place.types,
        })),
      });
    } else {
      res.status(404).json({ success: false, message: "No places found" });
    }
  } catch (error) {
    console.error("Places search error:", error);
    res.status(500).json({ success: false, message: "Places search failed" });
  }
});

// Get API key for frontend (for direct client-side integration)
authrouter.get("/google-maps-key", UserAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  });
});

// Debug route to check users
authrouter.get("/debug-users", async (req, res) => {
  try {
    const users = await UserModel.find({}, "email name role");
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default authrouter;
