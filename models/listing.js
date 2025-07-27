const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const review = require("./review.js");
const { ref } = require("joi");
const { listingSchema } = require("../schema");


const ListingSchema =  new Schema({
    title:{
        type:String,
    },
    description : String,
    image:{
        url : String,
        filename : String,
    },
    price:Number,
    location:String,
    country:String,
    category: {  // ← MOVE HERE
    type: String,
    enum: [
      "Trending",
      "Rooms",
      "Iconic cities",
      "Mountains",
      "Castles",
      "Amazing Pools",
      "Camping",
      "Farm",
      "Arctic",
      "Domes",
      "Boats"
    ],
  },
    reviews : [
        {
            type : Schema.Types.ObjectId,
            ref : "Review",
        },
    ],
    owner:{
        type : Schema.Types.ObjectId,
            ref : "User",
    },
    geometry : {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

ListingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing) {
        await review.deleteMany({_id : {$in:listing.reviews}});
    }   
});

const Listing = mongoose.model("listing",ListingSchema);
module.exports = Listing;
