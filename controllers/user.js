const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const awsUploadImage = require("../utils/aws-upload-image");

function createToken(user, SECRET_KEY, expiresIn) {
  const { id, name, email, username } = user;
  const payload = {
    id,
    name,
    email,
    username,
  };
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

async function register(input) {
  const newUser = input;
  newUser.email = newUser.email.toLowerCase();
  newUser.username = newUser.username.toLowerCase();

  const { email, username, password } = newUser;

  // revision del email por si esta en uso
  const foundEmail = await User.findOne({ email });
  if (foundEmail) throw new Error("el email ya esta en uso");

  // revision del username por si esta en uso
  const foundUsername = await User.findOne({ username });
  if (foundUsername) throw new Error("el nombre de usuario ya esta en uso");

  // encriptacion de contraseña
  const salt = await bcryptjs.genSaltSync(10);
  newUser.password = await bcryptjs.hash(password, salt);

  try {
    const user = new User(newUser);
    user.save();
    return user;
  } catch (error) {
    console.log(error);
  }
}

async function login(input) {
  const { email, password } = input;

  const userFound = await User.findOne({ email: email.toLowerCase() });
  if (!userFound) throw new Error("error en el email o contraseña");

  const passwordSuccess = await bcryptjs.compare(password, userFound.password);
  if (!passwordSuccess) throw new Error("error en el email o contraseña");

  return {
    token: createToken(userFound, process.env.SECRET_KEY, "400h"),
  };
}

async function getUser(id, username) {
  let user = null;
  if (id) user = await User.findById(id);
  if (username) user = await User.findOne({ username });

  if (!user) throw new Error("El ususario No Existe");

  return user;
}

async function updateAvatar(file, ctx) {
  const { createReadStream, mimetype } = await file;
  const extension = mimetype.split("/")[1];
  const imageName = `avatar/avt.${extension}`;
  const fileData = createReadStream();

  try {
    const result = await awsUploadImage(fileData, imageName);
    console.log(result);
  } catch (error) {
    return {
      status: false,
      urlAvatar: null,
    };
  }

  return null;
}

module.exports = { register, login, getUser, updateAvatar };
