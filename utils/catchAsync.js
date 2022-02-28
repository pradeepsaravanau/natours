module.exports = fn => {
  return (req, res, next) => {
    //we return with this and then the create tour for here is assigned with function properly
    //in js we can pass catch(err) instead of catch(err => next(err)) both will work
    //fn will call the function and then execute
    fn(req, res, next).catch(next);
  };
  //we need next in order to pass the error so global thing catches the error
};
