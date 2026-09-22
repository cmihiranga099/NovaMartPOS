namespace NovaMartPOS.Application.DTOs;

public class VerifyPinRequestDto
{
    public string Pin { get; set; } = string.Empty;
}

public class VerifyPinResponseDto
{
    public bool Approved { get; set; }
    public string? ApprovedBy { get; set; }
}