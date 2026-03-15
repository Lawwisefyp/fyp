import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import Case from '@/lib/models/Case';
import Notification from '@/lib/models/Notification';
import Message from '@/lib/models/Message';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.user._id;
    const userRole = auth.role;

    await dbConnect();

    let contacts = [];

    if (userRole === 'lawyer') {
      // 1. Get connected lawyers
      const lawyer = await Lawyer.findById(userId).populate('connections', 'fullName email personalInfo.profilePicture professionalInfo.specialization');
      if (lawyer && lawyer.connections) {
        lawyer.connections.forEach(c => {
          contacts.push({
            id: c._id,
            name: c.fullName,
            role: 'Lawyer',
            specialization: c.professionalInfo?.specialization || 'Advocate',
            avatar: c.personalInfo?.profilePicture,
            email: c.email
          });
        });
      }

      // 2. Get clients from assigned cases
      const cases = await Case.find({ lawyerId: userId });
      const clientEmails = [...new Set(cases.map(c => c.clientEmail))];
      const clients = await Client.find({ email: { $in: clientEmails } }, 'fullName email');

      clients.forEach(c => {
        if (!contacts.find(contact => contact.email === c.email)) {
          contacts.push({
            id: c._id,
            name: c.fullName,
            role: 'Client',
            email: c.email
          });
        }
      });

      // 3. Get clients from accepted connection requests
      const acceptedRequests = await Notification.find({
        toLawyerId: userId,
        type: 'connection_request',
        status: 'accepted'
      }).populate('fromClientId', 'fullName email');

      acceptedRequests.forEach(req => {
        if (req.fromClientId && !contacts.find(c => c.id.toString() === req.fromClientId._id.toString())) {
          contacts.push({
            id: req.fromClientId._id,
            name: req.fromClientId.fullName,
            role: 'Client',
            email: req.fromClientId.email
          });
        }
      });
    } else {
      // Current user is a client
      // 1. Get lawyers from assigned cases
      const cases = await Case.find({ clientEmail: auth.user.email }).populate('lawyerId', 'fullName email personalInfo.profilePicture professionalInfo.specialization');

      cases.forEach(c => {
        if (c.lawyerId && !contacts.find(contact => contact.id.toString() === c.lawyerId._id.toString())) {
          contacts.push({
            id: c.lawyerId._id,
            name: c.lawyerId.fullName,
            role: 'Lawyer',
            specialization: c.lawyerId.professionalInfo?.specialization || 'Advocate',
            avatar: c.lawyerId.personalInfo?.profilePicture,
            email: c.lawyerId.email
          });
        }
      });

      // 2. Get lawyers from accepted connection requests
      const acceptedRequests = await Notification.find({
        fromClientId: userId,
        type: 'connection_request',
        status: 'accepted'
      }).populate('toLawyerId', 'fullName email personalInfo.profilePicture professionalInfo.specialization');

      acceptedRequests.forEach(req => {
        if (req.toLawyerId && !contacts.find(c => c.id.toString() === req.toLawyerId._id.toString())) {
          contacts.push({
            id: req.toLawyerId._id,
            name: req.toLawyerId.fullName,
            role: 'Lawyer',
            specialization: req.toLawyerId.professionalInfo?.specialization || 'Advocate',
            avatar: req.toLawyerId.personalInfo?.profilePicture,
            email: req.toLawyerId.email
          });
        }
      });
    }

    // 4. Get anyone else the user has exchanged messages with
    const messageHistory = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    const messagedUserIds = new Set();
    const messagedUserModels = {};

    messageHistory.forEach(msg => {
      if (msg.senderId.toString() !== userId.toString()) {
        messagedUserIds.add(msg.senderId.toString());
        messagedUserModels[msg.senderId.toString()] = msg.senderModel;
      }
      if (msg.receiverId.toString() !== userId.toString()) {
        messagedUserIds.add(msg.receiverId.toString());
        messagedUserModels[msg.receiverId.toString()] = msg.receiverModel;
      }
    });

    for (const otherId of messagedUserIds) {
      if (!contacts.find(c => c.id.toString() === otherId)) {
        const model = messagedUserModels[otherId];
        let otherUser;
        if (model === 'Lawyer') {
          otherUser = await Lawyer.findById(otherId);
        } else {
          otherUser = await Client.findById(otherId);
        }

        if (otherUser) {
          contacts.push({
            id: otherUser._id,
            name: otherUser.fullName,
            role: model,
            specialization: model === 'Lawyer' ? (otherUser.professionalInfo?.specialization || 'Advocate') : null,
            avatar: model === 'Lawyer' ? otherUser.personalInfo?.profilePicture : null,
            email: otherUser.email
          });
        }
      }
    }

    // Add last message preview for each contact
    const contactsWithLastMsg = await Promise.all(contacts.map(async (contact) => {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: contact.id },
          { senderId: contact.id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });

      return {
        ...contact,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt,
          isSender: lastMsg.senderId.toString() === userId.toString(),
          isRead: lastMsg.isRead
        } : null
      };
    }));

    // Sort by last message date
    contactsWithLastMsg.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    return NextResponse.json({ success: true, contacts: contactsWithLastMsg });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
