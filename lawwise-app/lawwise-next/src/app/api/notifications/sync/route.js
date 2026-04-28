import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import Notification from '@/lib/models/Notification';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Set hours to end of day for the 2-day range
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const cases = await Case.find({ lawyerId: auth.user._id });
    let createdCount = 0;

    for (const c of cases) {
      // 1. Check Case Hearing Date
      if (c.nextHearingDate) {
        const hearingDate = new Date(c.nextHearingDate);
        
        // If hearing is within next 2 days and in the future
        if (hearingDate <= twoDaysFromNow && hearingDate >= now) {
          const daysLeft = Math.ceil((hearingDate - now) / (1000 * 60 * 60 * 24));
          
          // Check if we already sent a notification in the last 24 hours for this hearing
          const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const existingNotif = await Notification.findOne({
            toLawyerId: auth.user._id,
            type: 'hearing_reminder',
            message: { $regex: c.title, $options: 'i' },
            createdAt: { $gte: last24h }
          });

          if (!existingNotif) {
            const newNotif = new Notification({
              toLawyerId: auth.user._id,
              title: '📅 Hearing Reminder',
              message: `Upcoming hearing for "${c.title}" in ${daysLeft} day(s) (${hearingDate.toLocaleDateString()}).`,
              type: 'hearing_reminder',
              status: 'unread'
            });
            await newNotif.save();
            createdCount++;
          }
        }
      }

      // 2. Check Case Deadlines
      if (c.deadlines && c.deadlines.length > 0) {
        for (const deadline of c.deadlines) {
          if (deadline.isCompleted) continue;

          const dueDate = new Date(deadline.dueDate);
          if (dueDate <= twoDaysFromNow && dueDate >= now) {
            const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const existingNotif = await Notification.findOne({
              toLawyerId: auth.user._id,
              type: 'deadline',
              message: { $regex: deadline.title, $options: 'i' },
              createdAt: { $gte: last24h }
            });

            if (!existingNotif) {
              const newNotif = new Notification({
                toLawyerId: auth.user._id,
                title: '⏰ Deadline Reminder',
                message: `Deadline "${deadline.title}" for case "${c.title}" is due in ${daysLeft} day(s).`,
                type: 'deadline',
                status: 'unread'
              });
              await newNotif.save();
              createdCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications synchronized',
      createdCount,
      lastSync: now.toISOString()
    });
  } catch (error) {
    console.error('Sync notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
