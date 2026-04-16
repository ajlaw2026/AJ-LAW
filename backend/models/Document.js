const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  documentType: {
    type: String,
    enum: ['EC', 'Nagal', 'Agreement', 'Deed'],
    required: true
  },
  recordNo: {
    type: String,
    sparse: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'In Progress', 'Registered', 'Draft', 'Signed'],
    default: 'Pending'
  },
  // Details (Flexible properties depending on Document Type)
  office: String,
  nagar: String,
  surveyNo: String,
  tpNo: String,
  plotNo: String,
  reference: String,
  deedType: String,
  docNo: String,
  fieldVisit: String,
  returnDocument: String,
  customerName: String,
  vendor: String,
  ecNo: String,
  nagalNo: String,
  agreementType: String,
  deed: String,
  
  // Financial Tracking
  amount: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  editFee: { type: Number, default: 0 },
  stamp: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  writingFee: { type: Number, default: 0 },
  ddCommission: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  payments: [{
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    time: String,
    method: String,
    note: String
  }]
}, { timestamps: true });

// Pre-save middleware to calculate totalFee and balance accurately
documentSchema.pre('save', async function () {
  // Only billable items should contribute to totalFee (which is the Cost shown to user)
  if (this.documentType === 'EC' || this.documentType === 'Nagal') {
      this.totalFee = Number(this.amount || 0) + Number(this.commission || 0) + Number(this.others || 0);
  } else {
      // For Deed and Agreement: editFee + stamp + others + writingFee + ddCommission are all billable
      this.totalFee = Number(this.editFee || 0) + Number(this.stamp || 0) + Number(this.others || 0)
                    + Number(this.writingFee || 0) + Number(this.ddCommission || 0);
  }
  
  // If we have payments, sync received amount from the transaction history
  if (this.payments && this.payments.length > 0) {
    this.received = this.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  } else {
    // Keep existing received if no payments array yet (for legacy/safety)
    this.received = Number(this.received || 0);
  }
  
  this.balance = this.totalFee - this.received;
  
  // Auto-update status if balance is 0 and it was originally Pending
  if (this.balance <= 0 && this.status === 'Pending') {
    this.status = 'Completed';
  }
});

module.exports = mongoose.model('Document', documentSchema);
