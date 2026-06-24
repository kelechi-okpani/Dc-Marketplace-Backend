import { gql } from 'graphql-tag';

export default gql`
  type Notification {
    _id: ID!
    type: String!
    title: String!
    body: String!
    isRead: Boolean!
    readAt: String
    channel: String!
    createdAt: String!
  }

  type NotificationList {
    data: [Notification!]!
    unreadCount: Int!
  }

  extend type Query {
    notifications: NotificationList!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Boolean!
  }
`;