import { UserModel } from "../Models/User.models.js";
import axios from "axios";

export const stallDetails = async (req, res) => {
  const { stallName, foodType, city, phoneNumber, location } = req.body;
  const id = req.user.id;

  try {
    if (!stallName || !foodType || !city || !phoneNumber || !location) {
      return res
        .status(400)
        .json({ success: false, message: "Missing details!" });
    }
    const user = await UserModel.findById(id);
    user.set({ stallName, foodType, city, phoneNumber, location });
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "FoodFinder Vendor Details",
      text: `Your stall details have been saved at FoodFinder.`,
    };
    await transporter.sendMail(mailOption);

    return res
      .status(200)
      .json({ success: true, message: "Details added successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const findNearbyVendors = async (req, res) => {
  const {
    latitude,
    longitude,
    maxDistance = 5000,
    city,
    foodType,
    foodCategory,
    foodItem,
  } = req.body;

  try {
    let query = { role: "vendor" };

    // Add filters based on provided criteria
    if (city) query.city = new RegExp(city, "i"); // Case-insensitive city search
    if (foodType) query.foodType = foodType;
    // Note: foodCategory and foodItem require a menu schema

    let vendors;

    // If coordinates are provided, do location-based search
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: maxDistance,
        },
      };
    }

    vendors = await UserModel.find(query).select(
      "name stallName city phoneNumber foodType location"
    );

    // If we have coordinates, calculate distances using Google Maps
    let vendorsWithDistance = vendors.map((vendor) => ({
      name: vendor.name,
      stallName: vendor.stallName,
      city: vendor.city,
      phoneNumber: vendor.phoneNumber,
      foodType: vendor.foodType,
      latitude: vendor.location?.coordinates?.[1] || null,
      longitude: vendor.location?.coordinates?.[0] || null,
      distance: "Unknown",
      duration: "Unknown",
    }));

    // Only calculate distances if we have user coordinates AND vendors with locations
    if (latitude && longitude && vendors.length > 0) {
      const vendorsWithCoords = vendors.filter(
        (v) => v.location && v.location.coordinates
      );

      if (vendorsWithCoords.length > 0) {
        const origins = [`${latitude},${longitude}`];
        const destinations = vendorsWithCoords.map(
          (vendor) =>
            `${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`
        );

        try {
          const response = await axios.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json",
            {
              params: {
                origins: origins.join("|"),
                destinations: destinations.join("|"),
                key: process.env.GOOGLE_MAPS_API_KEY,
                units: "metric",
              },
            }
          );

          if (response.data.status === "OK") {
            let coordIndex = 0;
            vendorsWithDistance = vendors.map((vendor) => {
              if (vendor.location && vendor.location.coordinates) {
                const distanceData = response.data.rows[0].elements[coordIndex];
                coordIndex++;
                return {
                  name: vendor.name,
                  stallName: vendor.stallName,
                  city: vendor.city,
                  phoneNumber: vendor.phoneNumber,
                  foodType: vendor.foodType,
                  latitude: vendor.location.coordinates[1],
                  longitude: vendor.location.coordinates[0],
                  distance: distanceData.distance?.text || "Unknown",
                  duration: distanceData.duration?.text || "Unknown",
                };
              } else {
                return {
                  name: vendor.name,
                  stallName: vendor.stallName,
                  city: vendor.city,
                  phoneNumber: vendor.phoneNumber,
                  foodType: vendor.foodType,
                  latitude: null,
                  longitude: null,
                  distance: "Unknown",
                  duration: "Unknown",
                };
              }
            });
          }
        } catch (distanceError) {
          console.error("Google Maps Distance Matrix error:", distanceError);
          // Continue without distance calculation
        }
      }
    }

    return res.status(200).json({
      success: true,
      vendors: vendorsWithDistance,
      searchType: latitude && longitude ? "location-based" : "city-based",
    });
  } catch (err) {
    console.error("Error finding nearby vendors:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
