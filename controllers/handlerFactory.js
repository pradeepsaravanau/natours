const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//outer function
exports.deleteOne = Model =>
  //this function will return right away ..
  //works coz of closures .. the inner function will get access to the outer function even after the outer has already returned
  //inner function
  catchAsync(async (req, res, next) => {
    //204 no content
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('no document found with that ID', 404));
    }
    res.status(204).json({ status: 'success', data: null });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    //3rd argument options first option is new to true coz new updated doc is returned
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('no document found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: { data: doc } });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    console.log(doc);
    if (!doc) {
      return next(new AppError('no document found with that ID', 404));
    }
    //Tour.findOne({_id : req.params.id})
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //EXECUTE QUERY
    //to allow for nested get reviews  on tours (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter = { user: req.params.userId };
    console.log(filter);
    const features = new APIFeatures(
      Model.find(filter).populate('reviews'),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;
    //SEND RESPONSE
    res.status(200).json({
      //jsend formatdoc
      status: 'success',
      results: doc.length,
      data: {
        // doc: doc,
        data: doc
      }
    });
  });
