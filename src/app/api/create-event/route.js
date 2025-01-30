import { google } from "googleapis";

export async function POST(req) {
  try {
    const { events, tokens } = await req.json();
    console.log("Received tokens:", tokens);
    console.log("Received events:", events);

    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000"
    );

    // Set credentials
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: "https://www.googleapis.com/auth/calendar.events",
    });

    // Create calendar instance with authenticated client
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const createdEvents = [];

    // Ensure events is always an array
    const eventsArray = Array.isArray(events) ? events : [events];

    for (const eventData of eventsArray) {
      const event = {
        summary: eventData.summary,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: "Asia/Kolkata",
        },
      };

      try {
        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        });

        createdEvents.push(response.data);
      } catch (insertError) {
        console.error("Error inserting individual event:", insertError);

        // Check if it's an authentication error and attempt to refresh token
        if (insertError.code === 401) {
          try {
            const { credentials } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(credentials);

            // Retry event insertion with refreshed token
            const retryResponse = await calendar.events.insert({
              calendarId: "primary",
              requestBody: event,
            });

            createdEvents.push(retryResponse.data);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            throw new Error("Authentication failed. Please re-authenticate.");
          }
        } else {
          throw insertError;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Events created successfully",
        data: createdEvents,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Comprehensive error creating calendar event:", error);

    let errorMessage = "Failed to create events";
    if (error.response) {
      errorMessage += `: ${
        error.response.data?.error?.message || error.message
      }`;
    } else {
      errorMessage += `: ${error.message}`;
    }

    return new Response(
      JSON.stringify({
        message: errorMessage,
        error: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
