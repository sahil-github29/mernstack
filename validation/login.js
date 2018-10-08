const Validator = require("validator");
const isEmpty = require("./is-empty");
module.exports = function validateLoginInput(data) {
  let errors = {};

  // npm validator does not have a way to check `empty` value if it is not a string, so we implemented our own `isEmpty module`

  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "email field is required";
  }
  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "password must be atleast 6 characters";
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = "password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
