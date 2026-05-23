using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Controllers;

public class AdminController : Controller
{
    private readonly AdminRepository _repository;

    public AdminController(AdminRepository repository)
    {
        _repository = repository;
    }

    // GET: /Admin/Dashboard
    public IActionResult Dashboard()
    {
        // Đặt tiêu đề cho trang, sẽ được dùng trong _Layout.cshtml
        ViewData["Title"] = "Dashboard";
        return View(); // Trả về file Views/Admin/Dashboard.cshtml
    }

    // GET: /Admin/Users
    public async Task<IActionResult> Users()
    {
        ViewData["Title"] = "Quản lý tài khoản";
        var users = await _repository.GetUsersAsync("", "", ""); // Lấy tất cả user
        return View(users); // Trả về Views/Admin/Users.cshtml và truyền model vào
    }

    // GET: /Admin/Staff
    public async Task<IActionResult> Staff()
    {
        ViewData["Title"] = "Quản lý nhân viên";
        var staff = await _repository.GetStaffAsync("", "");
        return View(staff);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ChangeRole(string id, string role)
    {
        // TODO: Gọi service để thay đổi vai trò trong DB và Clerk
        // await _userService.ChangeRoleAsync(id, role);
        TempData["ToastMessage"] = $"Đã cập nhật vai trò cho người dùng.";
        TempData["ToastType"] = "success";
        return RedirectToAction("Users");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> LockUser(string id)
    {
        // TODO: Gọi service để khóa người dùng
        // await _userService.SetLockStatusAsync(id, true);
        TempData["ToastMessage"] = "Đã khóa tài khoản thành công.";
        TempData["ToastType"] = "success";
        return RedirectToAction("Users");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UnlockUser(string id)
    {
        // TODO: Gọi service để mở khóa người dùng
        // await _userService.SetLockStatusAsync(id, false);
        TempData["ToastMessage"] = "Đã mở khóa tài khoản.";
        TempData["ToastType"] = "info";
        return RedirectToAction("Users");
    }

    // Các action khác cho Reports...
}