const nodemailer = require('nodemailer');
const StudentRegister = require('../models/studentRegister');
const Installment = require('../models/installment');



exports.sendReceiptMail = async (req, res) => {
  const { email, message } = req.body;
  const pdfFile = req.file;

  if (!email || !pdfFile) {
    return res.status(400).json({ error: 'Email and receipt file are required.' });
  }

  const publicURL = pdfFile.path;

  try {
    // Email configuration (Gmail example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });



    const mailOptions = {
      from: `"Scope Tech" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your Course Receipt - Scope Tech Software Solution',
      html: `<p>${message || 'Please find your receipt attached.'}</p><p>Also available at: <a href="${publicURL}">${publicURL}</a></p>`,
      attachments: [
        {
          filename: pdfFile.originalname,
          path: pdfFile.path,
        }
      ]
    };
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
      fileName: pdfFile.filename,
      publicURL,
      info,
    });

  } catch (error) {
    console.error('❌ Error sending receipt email:', error);
    return res.status(500).json({ error: 'Server error while sending receipt' });
  }
};

exports.generateAndSendReceipt = async (req, res) => {
  const { registerId } = req.body;

  if (!registerId) {
    return res.status(400).json({ error: 'Register ID is required.' });
  }

  try {
    const reg = await StudentRegister.findById(registerId)
      .populate('student')
      .populate('course')
      .lean();

    if (!reg) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    if (!reg.student || !reg.student.studentMail) {
      return res.status(400).json({ error: 'Student email not found for this registration.' });
    }

    const history = await Installment.find({ register: registerId }).sort({ createdAt: 'asc' }).lean();

    const initialPayment = {
      createdAt: reg.createdAt,
      amountPaid: reg.amountReceived || 0,
      paymentMode: reg.paymentType,
      latePenalty: 0
    };

    const allPayments = [
        ...(initialPayment.amountPaid > 0 ? [initialPayment] : []),
        ...history
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const totalPenaltiesPaid = history.reduce((acc, item) => acc + (Number(item.latePenalty) || 0), 0);

    // Generate HTML for the receipt
    const receiptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #333;">Payment Receipt</h2>
        <p><strong>Student:</strong> ${reg.student.studentName}</p>
        <p><strong>Course:</strong> ${reg.course.courseName}</p>
        <hr>
        <h4>Payment History</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Penalty</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${allPayments.map((item, index) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.createdAt).toLocaleDateString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${index === 0 && initialPayment.amountPaid > 0 ? 'Initial Payment' : `Installment via ${item.paymentMode || item.paymentType}`}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${Number(item.latePenalty || 0).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${Number(item.amountPaid || item.amountReceived).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr>
        <div style="text-align: right;">
          <p><strong>Total Fees:</strong> ₹${Number(reg.courseFees).toLocaleString()}</p>
          <p><strong>Total Penalties:</strong> ₹${totalPenaltiesPaid.toLocaleString()}</p>
          <p><strong>Total Paid:</strong> ₹${Number(reg.amountReceived).toLocaleString()}</p>
          <h3><strong>Balance Due:</strong> ₹${Number(reg.balance).toLocaleString()}</h3>
        </div>
        <p style="text-align: center; color: #777; font-size: 12px;">Thank you for your payment!</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"STS-Training" <${process.env.EMAIL_USER}>`,
      to: reg.student.studentMail,
      subject: `Your Payment Receipt for ${reg.course.courseName}`,
      html: receiptHtml,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully!' });

  } catch (error) {
    console.error('❌ Error sending receipt email:', error);
    return res.status(500).json({ error: 'Server error while sending receipt' });
  }
};
