const { storeImageOnLocalAPI } = require('../../utils/RestAPI');
const { buildThumbsAndImages } = require('../../utils/thumbs');

module.exports = {
  UserQueryResolvers: {
    me: async (parent, args, { token, dataSources: { imageAPI, userAPI } }) => {
      const user = await userAPI.getMe(token);
      const avatarThumbs = user.avatar
        ? buildThumbsAndImages(await imageAPI.getImage(user.avatar, token), true).thumbs
        : null;
      const coverThumbs = user.cover
        ? buildThumbsAndImages(await imageAPI.getImage(user.cover, token), true).images
        : null;

      return Object.assign({}, user, { avatar: avatarThumbs, cover: coverThumbs });
    },

    user: async (parent, args, { token, dataSources: { imageAPI, userAPI } }) => {
      const user = await userAPI.getUser(args.userId, token);
      const avatarThumbs = user.avatar
        ? buildThumbsAndImages(await imageAPI.getImage(user.avatar, token), true).thumbs
        : null;
      const coverThumbs = user.cover
        ? buildThumbsAndImages(await imageAPI.getImage(user.cover, token), true).images
        : null;

      return Object.assign({}, user, { avatar: avatarThumbs, cover: coverThumbs });
    },

    listUsers: async (parent, args, { token, dataSources: { imageAPI, userAPI } }) => {
      const users = await userAPI.listUsers(token);
      const fullUsers = users.map(async (user) => {
        const avatarThumbs = user.avatar
          ? buildThumbsAndImages(await imageAPI.getImage(user.avatar, token), true).thumbs
          : null;
        const coverThumbs = user.cover
          ? buildThumbsAndImages(await imageAPI.getImage(user.cover, token), true).images
          : null;

        return Object.assign({}, user, { avatar: avatarThumbs, cover: coverThumbs });
      });

      return fullUsers;
    },
  },

  UserMutationResolvers: {
    createUser: async (parent, args, { token, dataSources: { userAPI } }) => {
      const { input } = args;
      const user = await userAPI.createUser(input, token);
      return user;
    },

    updateUser: async (parent, args, { token, dataSources: { userAPI } }) => {
      const { userId, input } = args;
      const user = await userAPI.updateUser(userId, input, token);
      return user;
    },

    updateAvatar: async (parent, args, { token, dataSources: { imageAPI, userAPI } }) => {
      const { userId } = await userAPI.getMe(token);

      const { file } = args;

      if (!file) {
        throw new Error('No file specified');
      }

      const imageData = await storeImageOnLocalAPI(file, token, true);

      const user = await userAPI.updateUser(userId, { avatar: imageData.key }, token);

      const avatarThumbs = user.avatar
        ? buildThumbsAndImages(await imageAPI.getImage(user.avatar, token), true).thumbs
        : null;

      const coverThumbs = user.cover
        ? buildThumbsAndImages(await imageAPI.getImage(user.cover, token), true).images
        : null;

      return Object.assign({}, user, { avatar: avatarThumbs, cover: coverThumbs });
    },

    updateCover: async (parent, args, { token, dataSources: { imageAPI, userAPI } }) => {
      const { userId } = await userAPI.getMe(token);

      const { file } = args;

      if (!file) {
        throw new Error('No file specified');
      }

      const imageData = await storeImageOnLocalAPI(file, token, true);

      const user = await userAPI.updateUser(userId, { cover: imageData.key }, token);

      const avatarThumbs = user.avatar
        ? buildThumbsAndImages(await imageAPI.getImage(user.avatar, token), true).thumbs
        : null;

      const coverThumbs = user.cover
        ? buildThumbsAndImages(await imageAPI.getImage(user.cover, token), true).images
        : null;

      return Object.assign({}, user, { avatar: avatarThumbs, cover: coverThumbs });
    },

    confirmEmail: async (parent, args, { dataSources: { userAPI } }) => {
      const { userId, input } = args;
      const status = await userAPI.confirmEmail(userId, input);
      return status;
    },
  },

  UserFieldResolvers: {
    async album(parent, args, { token, dataSources: { albumAPI } }) {
      if (!parent.album || !parent.album.id) {
        return null;
      }
      return await albumAPI.getAlbum(parent.album.id, token);
    },
  },
};
