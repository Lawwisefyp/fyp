const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  client: String,
  opposingParty: String,
  lawyer: String,
  court: String,
  judge: String,
  jurisdiction: String,
  filingDate: String,
  nextHearingDate: String,
  currentStage: Number,
  completedStages: [Number],
  stageHistory: [
    {
      stageId: Number,
      completedDate: String,
      actualDuration: Number
    }
  ],
  lastUpdateDate: String
});

module.exports = mongoose.model('Case', CaseSchema);