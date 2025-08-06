var express = require("express");
var router = express.Router();


const { RbacUserModel, PermissionModel, RoleModel, RolePermissionModel, UserRoleModel, YonghuUserModel } = require('../models/index');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { sendResetPasswordCode } = require('../utils/emailService');



/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// ======rbac权限管理======

// ======用户管理路由======
// 获取用户列表
router.get("/user", async function (req, res, next) {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          // $options: 'i' 表示不区分大小写
          { userName: { $regex: search, $options: "i" } },
          { realName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await RbacUserModel.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ _id: 1 });

    const total = await RbacUserModel.countDocuments(query);

    res.json({
      code: 200,
      message: "获取用户列表成功",
      data: {
        list: users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取用户列表失败",
      error: error.message,
    });
  }
});

// 获取用户角色列表
router.get("/user/:id/roles", async function (req, res, next) {
  try {
    const user = await RbacUserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 获取用户角色
    const userRoles = await UserRoleModel.find({ userId: req.params.id });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await RoleModel.find({ _id: { $in: roleIds } });

    res.json({
      code: 200,
      message: "获取用户角色成功",
      data: {
        user,
        roles,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取用户角色失败",
      error: error.message,
    });
  }
});

// 新增用户
router.post("/user", async function (req, res, next) {
  try {
    const {
      userName,
      passWord,
      realName,
      email,
      phone,
      roleIds = [],
    } = req.body;

    // 检查用户名是否已存在
    const existingUser = await RbacUserModel.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: "用户名已存在",
      });
    }

    // 生成用户ID
    const userId = `user_${Date.now()}`;

    // 创建用户
    const user = new RbacUserModel({
      _id: userId,
      userName,
      passWord,
      realName,
      email,
      phone,
    });

    const savedUser = await user.save();

    // 分配角色
    if (roleIds.length > 0) {
      const userRoles = roleIds.map((roleId) => ({
        userId: savedUser._id,
        roleId,
      }));
      await UserRoleModel.insertMany(userRoles);
    }

    res.json({
      code: 200,
      message: "新增用户成功",
      data: savedUser,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "新增用户失败",
      error: error.message,
    });
  }
});

// 编辑用户
router.put("/user/:id", async function (req, res, next) {
  try {
    const { userName, realName, email, phone, status, roleIds = [] } = req.body;

    // 检查用户是否存在
    const user = await RbacUserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 检查用户名是否被其他用户使用
    if (userName && userName !== user.userName) {
      const existingUser = await RbacUserModel.findOne({
        userName,
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: "用户名已存在",
        });
      }
    }

    // 更新用户信息
    const updateData = {
      userName: userName || user.userName,
      realName: realName || user.realName,
      email: email || user.email,
      phone: phone || user.phone,
      status: status || user.status,
      updatedAt: new Date(),
    };

    const updatedUser = await RbacUserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // 更新用户角色
    if (roleIds !== undefined) {
      // 删除原有角色
      await UserRoleModel.deleteMany({ userId: req.params.id });
      // 添加新角色
      if (roleIds.length > 0) {
        const userRoles = roleIds.map((roleId) => ({
          userId: req.params.id,
          roleId,
        }));
        await UserRoleModel.insertMany(userRoles);
      }
    }

    res.json({
      code: 200,
      message: "编辑用户成功",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "编辑用户失败",
      error: error.message,
    });
  }
});

// 删除用户
router.delete("/user/:id", async function (req, res, next) {
  try {
    const user = await RbacUserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 删除用户
    await RbacUserModel.findByIdAndDelete(req.params.id);

    // 删除用户角色关联
    await UserRoleModel.deleteMany({ userId: req.params.id });

    res.json({
      code: 200,
      message: "删除用户成功",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "删除用户失败",
      error: error.message,
    });
  }
});

// ======角色管理路由======
// 获取角色列表
router.get("/role", async function (req, res, next) {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ],
      };
    }

    const roles = await RoleModel.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ _id: 1 });

    const total = await RoleModel.countDocuments(query);

    res.json({
      code: 200,
      message: "获取角色列表成功",
      data: {
        list: roles,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取角色列表失败",
      error: error.message,
    });
  }
});

// 获取所有角色列表（用于选择）
router.get("/roles/all", async function (req, res, next) {
  try {
    const roles = await RoleModel.find({ status: "active" }).sort({ _id: 1 });

    res.json({
      code: 200,
      message: "获取角色列表成功",
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取角色列表失败",
      error: error.message,
    });
  }
});

// 获取角色权限树（用于权限分配）
router.get("/role/:id/permissions", async function (req, res, next) {
  try {
    const role = await RoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: "角色不存在",
      });
    }

    // 获取角色已分配的权限ID列表
    const rolePermissions = await RolePermissionModel.find({
      roleId: req.params.id,
    });
    const assignedPermissionIds = rolePermissions.map((rp) =>
      rp.permissionId.toString()
    );

    // 获取所有权限并构建树形结构
    const permissions = await PermissionModel.find({ status: "active" }).sort({
      sort: 1,
    });

    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => {
          if (parentId === null) {
            return !item.parentId || item.parentId === "";
          }
          return item.parentId === parentId;
        })
        .map((item) => ({
          ...item.toObject(),
          children: buildTree(items, item._id),
        }));
    };

    const tree = buildTree(permissions);

    res.json({
      code: 200,
      message: "获取角色权限树成功",
      data: {
        role,
        permissionTree: tree,
        assignedPermissionIds,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取角色权限树失败",
      error: error.message,
    });
  }
});

// 获取角色用户列表
router.get("/role/:id/users", async function (req, res, next) {
  try {
    const role = await RoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: "角色不存在",
      });
    }

    // 获取拥有该角色的用户
    const userRoles = await UserRoleModel.find({ roleId: req.params.id });
    const userIds = userRoles.map((ur) => ur.userId);
    const users = await RbacUserModel.find({ _id: { $in: userIds } });

    res.json({
      code: 200,
      message: "获取角色用户列表成功",
      data: {
        role,
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取角色用户列表失败",
      error: error.message,
    });
  }
});

// 新增角色
router.post("/role", async function (req, res, next) {
  try {
    const { name, code, description, permissionIds = [] } = req.body;

    // 检查角色代码是否已存在
    const existingRole = await RoleModel.findOne({ code });
    if (existingRole) {
      return res.status(400).json({
        code: 400,
        message: "角色代码已存在",
      });
    }

    // 生成角色ID
    const roleId = `role_${Date.now()}`;

    // 创建角色
    const role = new RoleModel({
      _id: roleId,
      name,
      code,
      description,
    });

    const savedRole = await role.save();

    // 分配权限（只分配二级菜单权限）
    if (permissionIds.length > 0) {
      const validPermissionIds = [];
      for (const permissionId of permissionIds) {
        const permission = await PermissionModel.findById(permissionId);
        if (permission && permission.parentId) {
          validPermissionIds.push(permissionId);
        }
      }

      if (validPermissionIds.length > 0) {
        const rolePermissions = validPermissionIds.map((permissionId) => ({
          roleId: savedRole._id,
          permissionId,
        }));
        await RolePermissionModel.insertMany(rolePermissions);
      }
    }

    res.json({
      code: 200,
      message: "新增角色成功",
      data: savedRole,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "新增角色失败",
      error: error.message,
    });
  }
});

// 编辑角色
router.put("/role/:id", async function (req, res, next) {
  try {
    const { name, code, description, status, permissionIds = [] } = req.body;

    // 检查角色是否存在
    const role = await RoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: "角色不存在",
      });
    }

    // 检查角色代码是否被其他角色使用
    if (code && code !== role.code) {
      const existingRole = await RoleModel.findOne({
        code,
        _id: { $ne: req.params.id },
      });
      if (existingRole) {
        return res.status(400).json({
          code: 400,
          message: "角色代码已存在",
        });
      }
    }

    // 更新角色信息
    const updateData = {
      name: name || role.name,
      code: code || role.code,
      description: description || role.description,
      status: status || role.status,
      updatedAt: new Date(),
    };

    const updatedRole = await RoleModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // 更新角色权限
    if (permissionIds !== undefined) {
      // 过滤掉一级菜单的权限ID，只保留二级菜单
      const validPermissionIds = [];
      for (const permissionId of permissionIds) {
        const permission = await PermissionModel.findById(permissionId);
        if (permission && permission.parentId) {
          validPermissionIds.push(permissionId);
        }
      }

      // 删除原有权限
      await RolePermissionModel.deleteMany({ roleId: req.params.id });

      // 添加新权限
      if (validPermissionIds.length > 0) {
        const rolePermissions = validPermissionIds.map((permissionId) => ({
          roleId: req.params.id,
          permissionId,
        }));
        await RolePermissionModel.insertMany(rolePermissions);
      }
    }

    res.json({
      code: 200,
      message: "编辑角色成功",
      data: updatedRole,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "编辑角色失败",
      error: error.message,
    });
  }
});

// 删除角色
router.delete("/role/:id", async function (req, res, next) {
  try {
    const role = await RoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: "角色不存在",
      });
    }

    // 删除角色
    await RoleModel.findByIdAndDelete(req.params.id);

    // 删除角色权限关联
    await RolePermissionModel.deleteMany({ roleId: req.params.id });

    // 删除用户角色关联
    await UserRoleModel.deleteMany({ roleId: req.params.id });

    res.json({
      code: 200,
      message: "删除角色成功",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "删除角色失败",
      error: error.message,
    });
  }
});

// 分配角色权限
router.post("/role/:id/permissions", async function (req, res, next) {
  try {
    const { permissionIds = [] } = req.body;

    const role = await RoleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: "角色不存在",
      });
    }

    // 过滤掉一级菜单的权限ID，只保留二级菜单
    const validPermissionIds = [];
    for (const permissionId of permissionIds) {
      const permission = await PermissionModel.findById(permissionId);
      if (permission && permission.parentId) {
        validPermissionIds.push(permissionId);
      }
    }

    // 删除原有权限
    await RolePermissionModel.deleteMany({ roleId: req.params.id });

    // 添加新权限
    if (validPermissionIds.length > 0) {
      const rolePermissions = validPermissionIds.map((permissionId) => ({
        roleId: req.params.id,
        permissionId,
      }));
      await RolePermissionModel.insertMany(rolePermissions);
    }

    res.json({
      code: 200,
      message: "权限分配成功",
      data: {
        roleId: req.params.id,
        permissionIds: validPermissionIds,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "权限分配失败",
      error: error.message,
    });
  }
});

// ======权限管理路由======
// 获取所有权限列表（用于选择）
router.get("/permissions/all", async function (req, res, next) {
  try {
    // 获取一级和二级所有菜单用于树形选择器
    const permissions = await PermissionModel.find({ status: "active" }).sort({
      sort: 1,
    });
    res.json({
      code: 200,
      message: "获取权限列表成功",
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取权限列表失败",
      error: error.message,
    });
  }
});

// 获取权限列表
router.get("/permission", async function (req, res, next) {
  try {
    const { page = 1, limit = 10, search = "", parentId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (parentId) {
      query.parentId = parentId;
    }
    // 获取所有二级菜单，先按parentId排序，再按sort排序
    // 确保parentId存在
    // $ne:不等于
    // const permissions = await PermissionModel.find({ status: 'active',parentId:{$ne:null} }).sort({parentId:1,sort:1});
    const permissions = await PermissionModel.find({
      ...query,
      parentId: { $ne: null },
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ parentId: 1, sort: 1 });

    const total = await PermissionModel.countDocuments(query);

    res.json({
      code: 200,
      message: "获取权限列表成功",
      data: {
        list: permissions,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取权限列表失败",
      error: error.message,
    });
  }
});

// 获取权限树形结构
router.get("/permission/tree", async function (req, res, next) {
  try {
    const permissions = await PermissionModel.find({ status: "active" }).sort({
      sort: 1,
    });

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => {
          if (parentId === null) {
            return !item.parentId || item.parentId === "";
          }
          return item.parentId === parentId;
        })
        .map((item) => ({
          ...item.toObject(),
          children: buildTree(items, item._id),
          // 移除disabled属性，允许一级菜单可选择
        }));
    };

    const tree = buildTree(permissions);

    res.json({
      code: 200,
      message: "获取权限树成功",
      data: tree,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取权限树失败",
      error: error.message,
    });
  }
});

// 新增权限
router.post("/permission", async function (req, res, next) {
  try {
    const { name, code, description, parentId, path, icon, sort, isShow } =
      req.body;

    // 检查权限代码是否已存在
    const existingPermission = await PermissionModel.findOne({ code });
    if (existingPermission) {
      return res.status(400).json({
        code: 400,
        message: "权限代码已存在",
      });
    }

    // 检查权限路径是否已存在
    if (path) {
      const existingPath = await PermissionModel.findOne({ path });
      if (existingPath) {
        return res.status(400).json({
          code: 400,
          message: "权限路径已存在",
        });
      }
    }

    // 生成权限ID
    let permissionId;
    if (parentId) {
      // 二级菜单：parentId-number
      const childCount = await PermissionModel.countDocuments({ parentId });
      permissionId = `${parentId}-${childCount + 1}`;
    } else {
      // 一级菜单：数字
      const parentCount = await PermissionModel.countDocuments({
        parentId: null,
      });
      permissionId = `${parentCount + 1}`;
    }

    // 创建权限
    const permission = new PermissionModel({
      _id: permissionId,
      name,
      code,
      description,
      parentId,
      path,
      icon,
      sort: sort || 0,
      isShow: isShow || false,
    });

    const savedPermission = await permission.save();

    res.json({
      code: 200,
      message: "新增权限成功",
      data: savedPermission,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "新增权限失败",
      error: error.message,
    });
  }
});

// 编辑权限
router.put("/permission/:id", async function (req, res, next) {
  try {
    const {
      name,
      code,
      description,
      parentId,
      path,
      icon,
      sort,
      isShow,
      status,
    } = req.body;

    // 检查权限是否存在
    const permission = await PermissionModel.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        code: 404,
        message: "权限不存在",
      });
    }

    // 检查权限代码是否被其他权限使用
    if (code && code !== permission.code) {
      const existingPermission = await PermissionModel.findOne({
        code,
        _id: { $ne: req.params.id },
      });
      if (existingPermission) {
        return res.status(400).json({
          code: 400,
          message: "权限代码已存在",
        });
      }
    }

    // 检查权限路径是否被其他权限使用
    if (path && path !== permission.path) {
      const existingPath = await PermissionModel.findOne({
        path,
        _id: { $ne: req.params.id },
      });
      if (existingPath) {
        return res.status(400).json({
          code: 400,
          message: "权限路径已存在",
        });
      }
    }

    // 更新权限信息
    const updateData = {
      name: name || permission.name,
      code: code || permission.code,
      description: description || permission.description,
      parentId: parentId || permission.parentId,
      path: path || permission.path,
      icon: icon || permission.icon,
      sort: sort !== undefined ? sort : permission.sort,
      isShow: isShow !== undefined ? isShow : permission.isShow,
      status: status || permission.status,
      updatedAt: new Date(),
    };

    const updatedPermission = await PermissionModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      code: 200,
      message: "编辑权限成功",
      data: updatedPermission,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "编辑权限失败",
      error: error.message,
    });
  }
});

// 获取权限角色列表
router.get("/permission/:id/roles", async function (req, res, next) {
  try {
    const permission = await PermissionModel.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        code: 404,
        message: "权限不存在",
      });
    }

    // 获取拥有该权限的角色
    const rolePermissions = await RolePermissionModel.find({
      permissionId: req.params.id,
    });
    const roleIds = rolePermissions.map((rp) => rp.roleId);
    const roles = await RoleModel.find({ _id: { $in: roleIds } });

    res.json({
      code: 200,
      message: "获取权限角色列表成功",
      data: {
        permission,
        roles,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取权限角色列表失败",
      error: error.message,
    });
  }
});

// 删除权限
router.delete("/permission/:id", async function (req, res, next) {
  try {
    const permission = await PermissionModel.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        code: 404,
        message: "权限不存在",
      });
    }

    // 检查是否有子权限
    const childPermissions = await PermissionModel.find({
      parentId: req.params.id,
    });
    if (childPermissions.length > 0) {
      return res.status(400).json({
        code: 400,
        message: "该权限下有子权限，无法删除",
      });
    }

    // 删除权限
    await PermissionModel.findByIdAndDelete(req.params.id);

    // 删除角色权限关联
    await RolePermissionModel.deleteMany({ permissionId: req.params.id });

    res.json({
      code: 200,
      message: "删除权限成功",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "删除权限失败",
      error: error.message,
    });
  }
});

// ======用户登录和权限验证======
// 用户登录
router.post("/login", async function (req, res, next) {
  try {
    const { userName, passWord } = req.body;

    // 查找用户
    const user = await RbacUserModel.findOne({ userName, passWord });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "用户名或密码错误",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        code: 403,
        message: "用户已被禁用",
      });
    }

    // 获取用户角色和权限
    const userRoles = await UserRoleModel.find({ userId: user._id });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await RoleModel.find({ _id: { $in: roleIds } });

    const rolePermissions = await RolePermissionModel.find({
      roleId: { $in: roleIds },
    });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    const permissions = await PermissionModel.find({
      _id: { $in: permissionIds },
    });

    // 构建用户菜单权限（只包含二级菜单）
    const menuPermissions = permissions.filter((p) => p.parentId);

    // 生成双token，将用户信息、角色、权限编码到token中
    const userInfo = {
      id: user._id,
      userName: user.userName,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
    };

    const tokens = generateTokens(userInfo, roles, menuPermissions);

    res.json({
      code: 200,
      message: "登录成功",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "登录失败",
      error: error.message,
    });
  }
});

// 发送重置密码验证码
router.post("/send-reset-code", async function (req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: "邮箱地址不能为空",
      });
    }

    // 查找用户
    const user = await RbacUserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "该邮箱地址未注册",
      });
    }

    // 生成6位数验证码
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 设置验证码过期时间（10分钟）
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 存储验证码到数据库
    await RbacUserModel.findByIdAndUpdate(user._id, {
      resetCode: verificationCode,
      resetCodeExpires: expiresAt,
    });

    // 发送邮件
    const emailResult = await sendResetPasswordCode(
      email,
      verificationCode,
      user.realName
    );

    // 统一返回格式，验证码放在data中
    res.json({
      code: 200,
      message: "验证码发送成功",
      data: {
        email: email,
        verificationCode: verificationCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "发送验证码失败",
      error: error.message,
    });
  }
});

// 重置密码
router.post("/reset-password", async function (req, res, next) {
  try {
    const { email, verificationCode, newPassword } = req.body;

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: "邮箱、验证码和新密码不能为空",
      });
    }

    // 查找用户
    const user = await RbacUserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 验证验证码
    if (!user.resetCode || user.resetCode !== verificationCode) {
      return res.status(400).json({
        code: 400,
        message: "验证码错误",
      });
    }

    // 检查验证码是否过期
    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return res.status(400).json({
        code: 400,
        message: "验证码已过期，请重新获取",
      });
    }

    // 检查新密码是否与旧密码相同
    if (newPassword === user.passWord) {
      return res.status(400).json({
        code: 400,
        message: "新密码与旧密码重复",
      });
    }

    // 更新密码并清除验证码
    await RbacUserModel.findByIdAndUpdate(user._id, {
      passWord: newPassword,
      resetCode: null,
      resetCodeExpires: null,
      updatedAt: new Date(),
    });

    res.json({
      code: 200,
      message: "密码重置成功",
      data: {
        email: email,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "密码重置失败",
      error: error.message,
    });
  }
});

// 刷新访问令牌
router.post("/refresh-token", async function (req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        code: 401,
        message: "未提供刷新令牌",
      });
    }

    // 验证refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // 查找用户确认用户仍然有效
    const user = await RbacUserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "用户不存在",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        code: 403,
        message: "用户已被禁用",
      });
    }

    // 获取用户角色和权限
    const userRoles = await UserRoleModel.find({ userId: user._id });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await RoleModel.find({ _id: { $in: roleIds } });

    const rolePermissions = await RolePermissionModel.find({
      roleId: { $in: roleIds },
    });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    const permissions = await PermissionModel.find({
      _id: { $in: permissionIds },
    });

    // 构建用户菜单权限（只包含二级菜单）
    const menuPermissions = permissions.filter((p) => p.parentId);

    // 生成新的双token，将用户信息、角色、权限编码到token中
    const userInfo = {
      id: user._id,
      userName: user.userName,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
    };

    const tokens = generateTokens(userInfo, roles, menuPermissions);

    res.json({
      code: 200,
      message: "刷新令牌成功",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        code: 401,
        message: "刷新令牌已过期，请重新登录",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        code: 401,
        message: "刷新令牌无效",
      });
    }

    res.status(500).json({
      code: 500,
      message: "刷新令牌失败",
      error: error.message,
    });
  }
});








// ======我的======

// 获取用户列表
router.get("/yonghu", async function (req, res, next) {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { nickname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await YonghuUserModel.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ _id: 1 });

    const total = await YonghuUserModel.countDocuments(query);

    res.json({
      code: 200,
      message: "获取用户列表成功",
      data: {
        list: users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取用户列表失败",
      error: error.message,
    });
  }
});

// 获取单个用户
router.get("/yonghu/:id", async function (req, res, next) {
  try {
    const user = await YonghuUserModel.findOne({ id: req.params.id }).sort({ _id: -1 });
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 从独立的订单表中获取用户的订单
    const orders = await YonghuOrderModel.find({ userId: req.params.id }).sort({ _id: -1 });

    // 从独立的优惠券表中获取用户的优惠券
    const coupons = await YonghuCouponModel.find({ userId: req.params.id }).sort({ _id: -1 });

    // 构建返回数据，包含用户信息、订单信息和优惠券信息
    const userData = {
      user,
      orders,
      coupons
    };

    res.json({
      code: 200,
      message: "获取用户信息成功",
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "获取用户信息失败",
      error: error.message,
    });
  }
});

// 修改用户个人信息
router.put("/yonghu/:id/profile", async function (req, res, next) {
  try {
    const { nickname, avatar, gender, phone, email } = req.body;

    // 参数验证
    if (!nickname || !phone || !email) {
      return res.status(400).json({
        code: 400,
        message: "昵称、手机号和邮箱为必填项",
      });
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: "请输入正确的手机号格式",
      });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        message: "请输入正确的邮箱格式",
      });
    }

    const user = await YonghuUserModel.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 检查手机号是否被其他用户使用
    const existingUserWithPhone = await YonghuUserModel.findOne({ 
      phone: phone, 
      id: { $ne: req.params.id } 
    });
    if (existingUserWithPhone) {
      return res.status(400).json({
        code: 400,
        message: "该手机号已被其他用户使用",
      });
    }

    // 检查邮箱是否被其他用户使用
    const existingUserWithEmail = await YonghuUserModel.findOne({ 
      email: email, 
      id: { $ne: req.params.id } 
    });
    if (existingUserWithEmail) {
      return res.status(400).json({
        code: 400,
        message: "该邮箱已被其他用户使用",
      });
    }

    // 更新个人信息
    const updateData = {
      nickname: nickname,
      avatar: avatar !== undefined ? avatar : user.avatar,
      gender: gender !== undefined ? gender : user.gender,
      phone: phone,
      email: email,
      updatedAt: new Date(),
    };

    const updatedUser = await YonghuUserModel.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true } //返回更新后的用户
    );

    res.json({
      code: 200,
      message: "修改个人信息成功",
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "修改个人信息失败",
      error: error.message,
    });
  }
});

module.exports = router;
