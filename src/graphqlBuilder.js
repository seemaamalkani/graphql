const { ApolloServer } = require('apollo-server-express');
const OpentracingExtension = require("apollo-opentracing").default;
const languageParser = require("accept-language-parser");

const config = require('../config');

const { Album, AlbumAPI, getAlbumResolvers } = require('./modules/album');
const { Auth, AuthAPI, getAuthResolvers } = require('./modules/auth');
const { BaseTypes, getBaseResolvers } = require('./modules/base');
const { Comment, CommentAPI, getCommentResolvers, } = require('./modules/comment');
const { Feed, FeedAPI, getFeedResolvers } = require('./modules/feed');
const { Image, ImageAPI } = require('./modules/image');
const { Media, MediaAPI, getMediaResolvers } = require('./modules/media');
const { Photo, getPhotoResolvers, } = require('./modules/photo');
const { Reaction, ReactionAPI, getReactionResolvers, } = require('./modules/reaction');
const { Translation, TranslationAPI, getTranslationResolvers, } = require('./modules/translation');
const { User, UserAPI, getUserResolvers, } = require('./modules/user');
const { Video, getVideoResolvers, } = require('./modules/video');
const { Vote, VoteAPI, getVoteResolvers, } = require('./modules/vote');

const HEADER_TRACE_ID = 'x-b3-traceid';
const HEADER_PARENT_SPAN_ID = 'x-b3-parentspanid';
const HEADER_TRACE_FIELDS = 'x-b3-custom-tracefields';

const { alwaysDisabled, traceAll } = config.tracing;

const shouldTraceRequest = (info) => {
  const traceId = info.request.headers.get(HEADER_TRACE_ID);
  return traceAll.requests || !!traceId;
};

const shouldTraceFieldResolver = (parent, args, context, info) => {
  const { tracing: { traceId, traceFields } } = context;
  return traceAll.fields || (traceId && traceFields);
};

const graphqlBuilder = (localTracer, serverTracer) => {
  const extensions = [];
  if (!alwaysDisabled) {
    extensions.push(() => new OpentracingExtension({
      server: serverTracer,
      local: localTracer,
      shouldTraceRequest,
      shouldTraceFieldResolver,
    }));
  }

  /******************************************************************************
   * TYPEDEFS
   *****************************************************************************/
  const typeDefs = [BaseTypes, Album, Auth, Comment, Feed, Image, Media, Photo, Reaction, Translation, User, Vote, Video,];

  /******************************************************************************
   * RESOLVERS
   *****************************************************************************/
  const { AlbumFieldResolvers, AlbumQueryResolvers, AlbumMutationResolvers } = getAlbumResolvers(localTracer);
  const { AuthMutationResolvers } = getAuthResolvers(localTracer);
  const { BaseQueryResolvers } = getBaseResolvers(localTracer);
  const { CommentFieldResolvers, CommentMutationResolvers, CommentQueryResolvers } = getCommentResolvers(localTracer);
  const { FeedQueryResolvers, FeedTypeResolvers } = getFeedResolvers(localTracer);
  const { MediaFieldResolvers, MediaMutationResolvers, MediaQueryResolvers, MediaTypeResolvers } = getMediaResolvers(localTracer);
  const { PhotoMutationResolvers } = getPhotoResolvers(localTracer);
  const { ReactionFieldResolvers, ReactionMutationResolvers, ReactionQueryResolvers, ReactionTypeResolvers, } = getReactionResolvers(localTracer);
  const { TranslationMutationResolvers, } = getTranslationResolvers(localTracer);
  const { UserFieldResolvers, UserMutationResolvers, UserQueryResolvers, } = getUserResolvers(localTracer);
  const { VideoMutationResolvers, VideoQueryResolvers, } = getVideoResolvers(localTracer);
  const { VoteQueryResolvers, VoteMutationResolvers, } = getVoteResolvers(localTracer);

  const resolvers = {
    Query: {
      ...BaseQueryResolvers,
      ...AlbumQueryResolvers,
      ...CommentQueryResolvers,
      ...FeedQueryResolvers,
      ...MediaQueryResolvers,
      ...ReactionQueryResolvers,
      ...UserQueryResolvers,
      ...VideoQueryResolvers,
      ...VoteQueryResolvers,
    },

    Mutation: {
      ...AlbumMutationResolvers,
      ...AuthMutationResolvers,
      ...CommentMutationResolvers,
      ...MediaMutationResolvers,
      ...PhotoMutationResolvers,
      ...ReactionMutationResolvers,
      ...TranslationMutationResolvers,
      ...UserMutationResolvers,
      ...VideoMutationResolvers,
      ...VoteMutationResolvers,
    },

    Album: { ...AlbumFieldResolvers },

    Comment: { ...CommentFieldResolvers },

    ...FeedTypeResolvers,

    ...MediaTypeResolvers,

    Media: { ...MediaFieldResolvers },

    ...ReactionTypeResolvers,

    Reaction: { ...ReactionFieldResolvers },

    User: { ...UserFieldResolvers },
  };

  /******************************************************************************
   * DATA SOURCES
   *****************************************************************************/
  const dataSources = () => ({
    albumAPI: new AlbumAPI(localTracer),
    commentAPI: new CommentAPI(localTracer),
    authAPI: new AuthAPI(localTracer),
    feedAPI: new FeedAPI(localTracer),
    imageAPI: new ImageAPI(localTracer),
    mediaAPI: new MediaAPI(localTracer),
    reactionAPI: new ReactionAPI(localTracer),
    translationAPI: new TranslationAPI(localTracer),
    userAPI: new UserAPI(localTracer),
    voteAPI: new VoteAPI(localTracer),
  });

  /******************************************************************************
   * GRAPHQL SERVER
   *****************************************************************************/
  return new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    extensions,
    formatError: (err) => {
      console.log('==================================');
      console.log('Error:');
      console.log(JSON.stringify(err, null, 2));
      console.log('==================================');
      return err;
    },
    context: ({ req }) => {
      console.log('--------------------------------------------------------------------------------');
      console.log('Request body:');
      console.log(req.body);
      console.log('--------------------------------------------------------------------------------');

      const token = req.headers.authorization || '';
      const locale = languageParser.parse(req.headers['accept-language'] || '');

      const tracing = {
        traceId: req.headers[HEADER_TRACE_ID],
        parentSpanId: req.headers[HEADER_PARENT_SPAN_ID],
        traceFields: req.headers[HEADER_TRACE_FIELDS],
      };

      return { locale, token, tracing };
    },
  });
};
module.exports = graphqlBuilder;
