# Library Book Pickup System

## Table of Contents
1. [Installation](#installation)
2. [Running the Project](#running-the-project)
3. [API Flow](#api-flow)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Testing](#testing)

## Installation

To set up this project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd library-pickup-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   OPEN_LIBRARY_API_BASE_URL=https://openlibrary.org/subjects/
   GENRE=science_fiction
   ```

## Running the Project

To run the project in development mode:

```
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## API Flow

Here's a step-by-step guide to test the main functionalities of the API:

1. **Get List of Books**
   - Endpoint: `GET /v1/books`
   - This will return a list of science fiction books fetched from the OpenLibrary API.

2. **Check Book Availability**
   - Endpoint: `GET /v1/books/works/{bookId}/availability`
   - Use a book ID from the previous request.
   - Example: `GET /v1/books/works/OL45883W/availability`

3. **Create an Appointment**
   - Endpoint: `POST /v1/appointments`
   - Request body:
     ```json
     {
       "bookId": "/works/OL45883W",
       "userId": "user123",
       "pickupTime": "2023-09-25T14:00:00Z"
     }
     ```
   - This creates a pending appointment.
   - User can only request appointment max 2 copies for each books

4. **Approve or Reject an Appointment**
   - Endpoint: `POST /v1/appointments/{appointmentId}/approve`
   - Example: `POST /v1/appointments/abc123/approve`
   - Request Body:
     ```json
     {
       "isApproved": true
     }
     ```
   - This endpoint approves or rejects a pending appointment based on the `isApproved` value.
   - If `isApproved` is `true`, the appointment is approved and book availability is updated.
   - If `isApproved` is `false`, the appointment is rejected without affecting book availability.
   - The appointment must be in a 'pending' status for this action to be valid.

5. **View All Appointments**
   - Endpoint: `GET /v1/appointments`
   - This will return a list of all appointments.

6. **View User Appointments**
   - Endpoint: `GET /v1/appointments/user/{userId}`
   - Example: `GET /v1/appointments/user/user123`
   - This endpoint returns a list of all appointments for the specified user.
   - The response includes details of each appointment along with the associated book information.

7. **View Appointments for a Specific Book**
   - Endpoint: `GET /v1/appointments/book/works/{bookId}`
   - Example: `GET /v1/appointments/book/works/OL45883W`
   - This endpoint returns a list of all appointments for the specified book.
   - The response includes the book details and a list of appointments associated with it.

8. **Cancel an Appointment**
   - Endpoint: `POST /v1/appointments/{appointmentId}/cancel`
   - Example: `POST /v1/appointments/abc123/cancel`

9. **Check Updated Book Availability**
   - Repeat step 2 to see the updated availability after approval and cancellation.

## API Endpoints

- `GET /v1/books`: Get all books
- `GET /v1/books/works/{bookId}/availability`: Check book availability
- `POST /v1/appointments`: Create a new appointment (status: pending)
- `POST /v1/appointments/{appointmentId}/approve`: Approve or Reject a pending appointment
- `GET /v1/appointments`: Get all appointments
- `GET /v1/appointments/user/{userId}`: Get user's appointments
- `GET /v1/appointments/book/works/{bookId}`: Get appointments for a specific book
- `POST /v1/appointments/{appointmentId}/cancel`: Cancel an appointment

Each endpoint returns data in the following format:

```json
{
  "status": 200,
  "message": "success",
  "data": { ... }
}
```
For API documentation, please refer to the API documentation file in doc/LibraryBook.postman_collection.json.

Appointment objects include the following fields:
- `id`: Unique identifier for the appointment
- `bookId`: ID of the book
- `userId`: ID of the user making the appointment
- `pickupTime`: Scheduled time for pickup
- `createdAt`: Timestamp when the appointment was created
- `status`: Can be 'pending', 'approved', 'cancelled', or 'completed'
- `approvedAt`: Timestamp when the appointment was approved

Note: Book availability is only updated when an appointment is approved, not when it's initially created.

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```json
{
  "status": 400,
  "message": "Error message here",
  "data": null
}
```

Common error scenarios:
- 400: Bad Request (e.g., invalid input, book not available)
- 404: Not Found (e.g., book or appointment not found)
- 500: Internal Server Error

## Testing

To run the test:

```
npm test
```