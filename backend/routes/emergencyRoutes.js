const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// GET /api/emergency/contacts - Get emergency contacts
router.get('/contacts', authenticateToken, (req, res) => {
  // For now, return static emergency contacts
  // In a real app, this would fetch from a database
  const emergencyContacts = [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "24/7, free and confidential support",
      type: "crisis"
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "24/7 text support with a crisis counselor",
      type: "crisis"
    },
    {
      name: "SAMHSA's National Helpline",
      number: "1-800-662-4357",
      description: "Treatment referral and information service",
      type: "support"
    }
  ];
  
  res.json(emergencyContacts);
});

// GET /api/emergency/resources - Get emergency resources
router.get('/resources', authenticateToken, (req, res) => {
  // For now, return static emergency resources
  // In a real app, this would fetch from a database
  const emergencyResources = [
    {
      title: "Coping Strategies",
      content: "Deep breathing, grounding exercises, and mindfulness techniques",
      type: "self-help"
    },
    {
      title: "Safety Plan",
      content: "Steps to take when feeling unsafe or at risk",
      type: "planning"
    },
    {
      title: "Support Groups",
      content: "Local and online support groups for mental health",
      type: "community"
    }
  ];
  
  res.json(emergencyResources);
});

module.exports = router; 