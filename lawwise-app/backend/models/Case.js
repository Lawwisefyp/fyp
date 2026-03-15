const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  client: String,
  clientEmail: String,
  clientPhone: String,
  opposingParty: String,
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
  court: String,
  judge: String,
  jurisdiction: String,
  caseType: {
    type: String,
    enum: ['civil', 'criminal', 'family', 'corporate', 'labor', 'intellectual'],
    default: 'civil'
  },
  filingDate: String,
  nextHearingDate: String,
  description: String,
  currentStage: { type: Number, default: 0 },
  completedStages: [Number],
  stageHistory: [
    {
      stageId: Number,
      completedDate: String,
      actualDuration: Number
    }
  ],
  documents: [
    {
      filename: String,
      originalName: String,
      filepath: String,
      uploadDate: { type: Date, default: Date.now },
      fileSize: Number,
      documentType: String
    }
  ],
  status: {
    type: String,
    enum: ['filed', 'assigned', 'in-progress', 'hearings', 'completed', 'closed'],
    default: 'filed'
  },
  deadlines: [
    {
      title: String,
      dueDate: String,
      description: String,
      isCompleted: { type: Boolean, default: false }
    }
  ],
  createdDate: { type: Date, default: Date.now },
  lastUpdateDate: String
});

module.exports = mongoose.model('Case', CaseSchema);