import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/lib/models/Message';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = auth.user._id;

    // 1. Get all unique conversation partners from message history
    const history = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    const contactMap = new Map();

    // Process message history to find partners
    history.forEach(msg => {
      const partnerId = msg.senderId.toString() === userId.toString() 
        ? msg.receiverId.toString() 
        : msg.senderId.toString();
      
      const partnerModel = msg.senderId.toString() === userId.toString() 
        ? msg.receiverModel 
        : msg.senderModel;

      if (!contactMap.has(partnerId)) {
        contactMap.set(partnerId, {
          id: partnerId,
          role: partnerModel,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isSender: msg.senderId.toString() === userId.toString(),
            isRead: msg.isRead
          }
        });
      }
    });

    // 2. If lawyer, also add connections (even if no messages yet)
    if (auth.role === 'lawyer') {
      const lawyer = await Lawyer.findById(userId).populate('connections', 'fullName profilePicture');
      if (lawyer && lawyer.connections) {
        lawyer.connections.forEach(conn => {
          const connId = conn._id.toString();
          if (!contactMap.has(connId)) {
            contactMap.set(connId, {
              id: connId,
              name: conn.fullName,
              avatar: conn.personalInfo?.profilePicture || null,
              role: 'Lawyer',
              lastMessage: null
            });
          } else {
            // Update name/avatar if they exist in connection but were missing from message map
            const existing = contactMap.get(connId);
            existing.name = conn.fullName;
            existing.avatar = conn.personalInfo?.profilePicture || null;
          }
        });
      }
    }

    // 3. Fetch missing details (names/avatars) for contacts from history
    const contacts = Array.from(contactMap.values());
    await Promise.all(contacts.map(async (contact) => {
      if (!contact.name) {
        if (contact.role === 'Lawyer') {
          const l = await Lawyer.findById(contact.id).select('fullName personalInfo');
          if (l) {
            contact.name = l.fullName;
            contact.avatar = l.personalInfo?.profilePicture || null;
          }
        } else {
          const c = await Client.findById(contact.id).select('fullName');
          if (c) {
            contact.name = c.fullName;
            contact.avatar = null; // Clients don't have PFP in schema yet
          }
        }
      }
    }));

    // Filter out any contacts we couldn't find names for (deleted users etc)
    const validContacts = contacts.filter(c => c.name);

    // Sort: contacts with messages first (by date), then by name
    validContacts.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, contacts: validContacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
