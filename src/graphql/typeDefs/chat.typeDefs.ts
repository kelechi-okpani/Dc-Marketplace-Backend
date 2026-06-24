import { gql } from 'graphql-tag';

export default gql`
  type Conversation {
    _id: ID!
    listing: Listing!
    buyer: PublicProfile!
    seller: PublicProfile!
    lastMessagePreview: String
    lastMessageAt: String
    isBlocked: Boolean!
    isActive: Boolean!
    createdAt: String!
  }

  type Message {
    _id: ID!
    conversation: ID!
    sender: PublicProfile!
    content: String!
    messageType: String!
    isDeleted: Boolean!
    createdAt: String!
  }

  type MessageList {
    data: [Message!]!
    total: Int!
  }

  extend type Query {
    conversations: [Conversation!]!
    messages(conversationId: ID!, page: Int, limit: Int): MessageList!
  }

  extend type Mutation {
    startConversation(listingId: ID!): Conversation!
    sendMessage(conversationId: ID!, content: String!, messageType: String): Message!
    blockConversation(conversationId: ID!): Boolean!
  }

  type Subscription {
    newMessage(conversationId: ID!): Message!
    conversationUpdated: Conversation!
  }
`;