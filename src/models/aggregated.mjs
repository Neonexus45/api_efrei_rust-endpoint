import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  // Données brutes du pipeline Rust
  user: {
    name: String,
    email: String,
    gender: String,
    location: String,
    picture: String
  },
  phone_number: String,
  iban: String,
  credit_card: {
    card_number: String,
    card_type: String,
    expiration_date: String,
    cvv: String
  },
  random_name: String,
  pet: String,
  quote: {
    content: String,
    author: String
  },
  joke: {
    type: { type: String },
    content: String
  },

  // Dark Data calculés automatiquement
  dark_data: {
    financial_risk_score: {
      type: Number,
      min: 0,
      max: 100
    },
    behavioral_profile: {
      is_synthetic: Boolean,
      cultural_coherence: {
        type: Number,
        min: 0,
        max: 1
      },
      name_pattern: {
        type: String,
        enum: ['latin', 'arabic', 'cyrillic', 'cjk', 'mixed', 'unknown']
      }
    },
    cultural_diversity_index: {
      type: Number,
      min: 0,
      max: 1
    },
    metadata_enrichment: {
      completeness_score: {
        type: Number,
        min: 0,
        max: 100
      },
      ingestion_timestamp: Date,
      data_quality_flags: [String],
      source: String
    }
  }
}, {
  collection: 'aggregated_data',
  minimize: false,
  versionKey: false,
  timestamps: true
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;
    delete retUpdated._id;
    return retUpdated;
  }
});

export default Schema;
