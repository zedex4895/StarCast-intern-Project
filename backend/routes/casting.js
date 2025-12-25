const express = require('express');
const CastingTicket = require('../models/CastingTicket');
const Registration = require('../models/Registration');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all casting tickets (public - only approved)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // If no status specified, only show approved tickets (for public)
    if (!status) {
      query.status = 'approved';
    } else if (status === 'all') {
      // Admin can see all tickets
      query = {};
    } else {
      query.status = status;
    }
    
    const tickets = await CastingTicket.find(query)
      .populate('createdBy', 'name email')
      .populate('registeredUsers', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single casting ticket
router.get('/:id', async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('registeredUsers', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get registered users for a ticket (casting/admin only - only ticket creator or admin)
router.get('/:id/registrations', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only ticket creator or admin can view registrations
    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view registrations' });
    }

    // Get registrations with phone numbers
    const registrations = await Registration.find({ ticket: req.params.id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      ticket: {
        id: ticket._id,
        title: ticket.title,
        registeredCount: registrations.length
      },
      registeredUsers: registrations.map(reg => ({
        _id: reg.user._id,
        name: reg.user.name,
        email: reg.user.email,
        phoneNumber: reg.phoneNumber,
        registeredAt: reg.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create casting ticket (casting role only)
router.post('/', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const { title, description, category, location, date, image } = req.body;

    if (!title || !description || !category || !location || !date) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const ticket = new CastingTicket({
      title,
      description,
      category,
      location,
      date,
      image: image || null,
      status: 'pending', // Always pending when created by casting director
      createdBy: req.user.id
    });

    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register for casting ticket (user role only)
router.post('/:id/register', auth, authorize('user'), async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'approved') {
      return res.status(400).json({ message: 'This ticket is not approved yet' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      ticket: req.params.id,
      user: req.user.id
    });

    if (existingRegistration || ticket.registeredUsers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already registered' });
    }

    // Create registration with phone number
    const registration = new Registration({
      ticket: req.params.id,
      user: req.user.id,
      phoneNumber
    });

    await registration.save();

    // Add user to ticket's registeredUsers array
    ticket.registeredUsers.push(req.user.id);
    await ticket.save();

    res.json({ message: 'Registered successfully', ticket });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already registered' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update casting ticket (casting/admin only)
router.put('/:id', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(ticket, req.body);
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve ticket (admin only)
router.patch('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'approved';
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json({ message: 'Ticket approved successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject ticket (admin only)
router.patch('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'rejected';
    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.json({ message: 'Ticket rejected successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete casting ticket (casting/admin only)
router.delete('/:id', auth, authorize('casting', 'admin'), async (req, res) => {
  try {
    const ticket = await CastingTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

