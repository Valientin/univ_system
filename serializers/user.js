const main = (user) => {
    const onlyUserData = Object.reject({ ...user.dataValues }, ['teacher', 'student']);
    const studentData = {};
    const teacherData = {};
    const groupData = {};
    const cathedraData = {};
    const facultyData = {};
    const learnFormData = {};

    if (user.roleName == 'student') {
        Object.assign(studentData, Object.reject({
            ...user.student.dataValues
        }, ['group', 'learnForm']));
        Object.assign(groupData, Object.reject({
            ...user.student.group.dataValues
        }, ['cathedra']));
        Object.assign(learnFormData, Object.reject({
            ...user.student.learnForm.dataValues
        }, []));
        Object.assign(cathedraData, Object.reject({
            ...user.student.group.cathedra.dataValues
        }, ['faculty']));
        Object.assign(facultyData, Object.reject({
            ...user.student.group.cathedra.faculty.dataValues
        }, []));
    }

    if (user.roleName == 'teacher') {
        Object.assign(teacherData, Object.reject({
            ...user.teacher.dataValues
        }, ['cathedra']));
        Object.assign(cathedraData, Object.reject({
            ...user.teacher.cathedra.dataValues
        }, ['faculty']));
        Object.assign(facultyData, Object.reject({
            ...user.teacher.cathedra.faculty.dataValues
        }, []));
    }

    return Object.assign(onlyUserData, {
        group: groupData,
        student: studentData,
        learnForm: learnFormData,
        cathedra: cathedraData,
        faculty: facultyData,
        teacher: teacherData
    });
};

module.exports = {
    main
};
