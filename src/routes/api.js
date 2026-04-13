const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const PurchaseRequest = require('../models/PurchaseRequest');

// POST /api/contact
router.post('/contact', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'الاسم مطلوب' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });
    }

    ContactMessage.create({
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      subject: subject ? subject.trim() : null,
      message: message.trim()
    });

    return res.json({ success: true, message: 'تم إرسال رسالتك بنجاح' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الرسالة' });
  }
});

// POST /api/purchase/individual
router.post('/purchase/individual', (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }

    const data = { ...req.body, request_type: 'individual' };
    PurchaseRequest.create(data);

    return res.json({ success: true, message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً' });
  } catch (error) {
    console.error('Individual purchase request error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الطلب' });
  }
});

// POST /api/purchase/corporate
router.post('/purchase/corporate', (req, res) => {
  try {
    const { company_name, phone } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ success: false, message: 'اسم الشركة مطلوب' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }

    const data = { ...req.body, request_type: 'corporate' };
    PurchaseRequest.create(data);

    return res.json({ success: true, message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً' });
  } catch (error) {
    console.error('Corporate purchase request error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الطلب' });
  }
});

module.exports = router;
