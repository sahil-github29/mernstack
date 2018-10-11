const Validator = require("validator");
const isEmpty = require("./is-empty");
module.exports = function validatePostInput(data) {
  let errors = {};

  // npm validator does not have a way to check `empty` value if it is not a string, so we implemented our own `isEmpty module`

  data.text = !isEmpty(data.text) ? data.text : "";

  if (Validator.isEmpty(data.text)) {
    errors.text = "text is invalid";
  }
  if (!Validator.isLength(data.text, { min: 10, max: 300 })) {
    errors.text = "Text must be between 10 to 300 characters";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
