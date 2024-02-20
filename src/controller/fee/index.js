const mongoose = require("mongoose");
const ClassModel = require("../../model/class");
const Fee = require("../../model/fee");
const Student = require("../../model/student");

module.exports = {
    async main(req, res) {
        try {
            // const classes = await ClassModel.find().select('name');
            const classes = await ClassModel.aggregate([
                {
                    $match: {
                        status: 'publish'
                    } // Match all classes or add any specific conditions here
                },
                {
                    $lookup: {
                        from: 'users', // Assuming your student model is named 'students'
                        localField: '_id',
                        foreignField: 'admission',
                        as: 'students' // Name for the field to store the matched students
                    }
                },
                {
                    $addFields: {
                        totalStudents: { $size: '$students' } // Count the number of students in each class
                    }
                },
                {
                    $project: {
                        students: 0 // Exclude the 'students' array from the final result if not needed
                    }
                }
            ]);
            return res.render("fee/index", { classes });
        } catch (error) {
            req.flash("error", "صارفین دیکھتے وقت خرابی:۔ " + error.message);
            return res.redirect("/");
        }
    },
    // read fee single class
    async class(req, res) {
        try {
            const admission = req.params.id;
            // const students = await Student.find({ admission, status: 'publish' }).populate('fees.fee');
            // console.log('studnets', students);
            // here it will find sutdents and also add field pending for fees if student have any pending payment
            // then payment pending should be true
            const students = await Student.aggregate([
                {
                    $match: { admission: new mongoose.Types.ObjectId(admission), status: 'publish' } // Your initial match stage
                },
                {
                    $addFields: {
                        pending: {
                            $cond: {
                                if: {
                                    $isArray: '$fees',
                                },
                                then: {
                                    $anyElementTrue: {
                                        $map: {
                                            input: '$fees',
                                            in: { $eq: ['$$this.status', 'pending'] }
                                        }
                                    }
                                },
                                else: false
                            }
                        }
                    }
                }
            ]);
            // students.forEach((std, index) => console.log('indeex : ', index, ' : ', std.fees))
            return res.render('fee/allStudents', {
                students
            });
        } catch (err) {
            console.log(err.message);
            req.flash("error", "صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // fee portal
    async portal(req, res) {
        try {
            const classes = await ClassModel.find({ status: 'publish' }).select('name');
            return res.render('fee/feePortal', { classes });
        } catch (err) {
            req.flash("error", " : fee/portal صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // edit class portal single fee portal class
    async portalClass(req, res) {
        try {
            const admission = req.params.id;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed, so we add 1 to get the current month

            const result = await ClassModel.findById(admission).select('fee name').populate('fee');
            console.log(result);
            const currentMonthFee = await ClassModel.aggregate([
                {
                    $match: { _id: admission }
                },
                {
                    $lookup: {
                        from: 'fees',
                        localField: 'fee',
                        foreignField: '_id',
                        as: 'fee'
                    }
                },
                // {
                //     $addFields: {
                //         fee: {
                //             $filter: {
                //                 input: "$fee",
                //                 as: "fee",
                //                 cond: { $eq: [{ $month: { $toDate: "$$fee.createdAt" } }, currentMonth] }
                //             }
                //         }
                //     }
                // }
            ]);
            console.log('currentMonthFee', currentMonthFee);
            const { name, fee } = result;
            return res.render('fee/feePortalSingleClass', { id: admission, fees: fee, name });
        } catch (err) {
            req.flash("error", " : fee/portal/class/ صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // additon of fee
    async addFee(req, res) {
        try {
            const fee = req.body;
            const feeModal = await Fee({ ...fee }).save().then(async (savedDoc) => {
                // fee.class is an ID of the class obtained from req.body...
                const classmodal = await ClassModel.findById(fee.class);
                const isIdPresent = classmodal.fee.some(feeId => feeId.equals(savedDoc._id));
                if (classmodal) {
                    if (!isIdPresent) {
                        classmodal.fee.push(savedDoc._id); // Pushing the savedDoc._id into the fee array
                        await classmodal.save();
                    } else {
                        throw new Error('Id Already Present there');
                    }
                } else {
                    throw new Error('Class not found')
                    // Handle the scenario where the class is not found
                }
                return savedDoc;
            });

            return res.redirect(`/fee/portal/class/${fee.class}`);

            // if want to use an ajax...
        } catch (err) {
            req.flash("error", " : addFee/ صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // update form fee
    async updateFee(req, res) {
        try {
            const { id, name, amount } = req.body;

            const updateFee = await Fee.findByIdAndUpdate(id, { name, amount }, { new: true });
            if (!updateFee) {
                return res.status(404).send({ error: 'Fee not found' });
            }

            console.log('updated', updateFee);
            return res.send({ updateFee });

            // if want to use an ajax...
        } catch (error) {
            return res.send({ error });
        }
    },
    // find fee
    async findFee(req, res) {
        try {
            const feeId = req.params.id;
            let fee = await Fee.findById(feeId);
            console.log(fee);
            return res.send({ fee });
        } catch (err) {
            req.flash("error", " : findFee/ صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // send fee docs to students
    async sendFee(req, res) {
        try {
            const { admission } = req.body
            const fee = req.params.id;
            const data = {
                fee,
                status: 'pending'
            };
            console.log(data);
            // const students = await Student.findOneAndUpdate(
            //     { admission })
            console.log(admission)
            const students = await Student.updateMany(
                { admission: new mongoose.Types.ObjectId(admission), status: 'publish' },
                { $push: { fees: data }, },
                { new: true }
            );
            console.log('students', students);
            if (students.modifiedCount) {
                await Fee.findByIdAndUpdate(fee, { status: 'sent' });
                return res.send({ students, body: req.body });
            } else {
                throw new Error('Users not found');
            }
        } catch (err) {
            console.log('error in the last', err);
            return res.status(501).send({ err });
        }
    },
    //show single sutdent
    async singleStudent(req, res) {
        try {
            const id = req.params.id;
            // exclude status from fee population.
            const { name, fees } = await Student.findById(id).select('name fees').populate({ path: 'fees.fee', select: '-status' });
            return res.render('fee/singleStudent', { name, fees, id });
        } catch (err) {
            req.flash("error", " : fee/student/id صارفین دیکھتے وقت خرابی:۔" + err.message);
            return res.redirect("/");
        }
    },
    // paying student fee
    async payingStudent(req, res) {
        try {
            const { userId, feeId } = req.body;
            console.log(req.body);
            const user = await Student.findByIdAndUpdate(userId,
                {
                    $set: { 'fees.$[elem].status': 'completed' }
                },
                {
                    arrayFilters: [{ 'elem._id': feeId }]
                },
                { new: true }
            );
            if (user) {
                return res.send({ user: user });
            } else {
                throw new Error('User not found');
            }
            return res.send({ body: req.body })
        } catch (err) {
            return res.status(501).send({ err: err.message });
        }
    },
};
