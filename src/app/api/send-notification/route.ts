import { NextResponse } from 'next/server';
import { getNeynarClient } from '@/lib/neynar';
import type { NotificationCategory } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    // Parse request data
    const { targetFids, category } = await request.json();
    
    // Validate inputs
    if (!targetFids || !Array.isArray(targetFids) || targetFids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing targetFids' },
        { status: 400 }
      );
    }
    
    if (!category) {
      return NextResponse.json(
        { error: 'Missing notification category' },
        { status: 400 }
      );
    }
    
    // Create notification content based on category
    let notification;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dollarchain.xyz';
    
    switch (category as NotificationCategory) {
      case 'welcome':
        notification = {
          title: 'Congrats! 🎉',
          body: 'Welcome notifications are working!',
          target_url: `${baseUrl}/`,
        };
        break;
      case 'test':
        notification = {
          title: 'Test Notification 🧪',
          body: 'This is a test notification',
          target_url: `${baseUrl}/`,
        };
        break;
      case 'update':
        notification = {
          title: 'New Update 📢',
          body: 'The app has been updated with new features!',
          target_url: `${baseUrl}/`,
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification category' },
          { status: 400 }
        );
    }
    
    // Get Neynar client
    const client = getNeynarClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Failed to initialize Neynar client' },
        { status: 500 }
      );
    }
    
    // Send notification with retry logic
    let attempts = 0;
    const maxAttempts = 2;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Call Neynar API to send notification
        const response = await client.publishFrameNotifications({
          targetFids,
          notification,
        });
        
        // Return success response
        return NextResponse.json({ 
          success: true, 
          sentTo: targetFids.length,
          response,
          attempt: attempts
        });
      } catch (apiError) {
        lastError = apiError;
        
        // Only retry once
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error('Failed to send notification after retries:', lastError);
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: lastError instanceof Error ? lastError.message : 'Unknown error',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in send-notification route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 