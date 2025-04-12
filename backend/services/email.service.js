const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email service for sending notifications to users
 */
class EmailService {
    constructor() {
        // Create reusable transporter using environment variables
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Verify connection configuration
        this.verifyConnection();
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('Email service is ready to send messages');
        } catch (error) {
            console.error('Error setting up email service:', error);
        }
    }

    /**
     * Send welcome email to a new user
     * @param {Object} user - The user object
     * @param {string} password - Optional plain password for new users
     */
    async sendWelcomeEmail(user, password = null) {
        try {
            const passwordInfo = password
                ? `<p>Your temporary password is: <strong>${password}</strong></p>
           <p>Please change your password after first login.</p>`
                : '';

            await this.transporter.sendMail({
                from: `"CodeReview Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Welcome to CodeReview!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to CodeReview, ${user.firstName}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Username: ${user.username}</p>
            ${passwordInfo}
            <p>You can now log in to our platform and start collaborating with your team.</p>
            <p>Best regards,<br>The CodeReview Team</p>
          </div>
        `
            });
            console.log(`Welcome email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error(`Error sending welcome email to ${user.email}:`, error);
            return false;
        }
    }

    /**
     * Send project invitation email
     * @param {Object} user - The user object
     * @param {Object} project - The project object
     * @param {Object} team - The team object
     * @param {string} accessLevel - The team's access level in the project
     */
    async sendProjectInvitationEmail(user, project, team, accessLevel) {
        try {
            await this.transporter.sendMail({
                from: `"CodeReview Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `You've been added to project: ${project.name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Project Invitation</h2>
            <p>Hello ${user.firstName},</p>
            <p>You have been added to the project <strong>${project.name}</strong> as part of the team <strong>${team.name}</strong>.</p>
            <p>Your team has <strong>${accessLevel}</strong> access to this project.</p>
            <p>You can now log in to our platform and start working on this project.</p>
            <p>Best regards,<br>The CodeReview Team</p>
          </div>
        `
            });
            console.log(`Project invitation email sent to ${user.email} for project ${project.name}`);
            return true;
        } catch (error) {
            console.error(`Error sending project invitation email to ${user.email}:`, error);
            return false;
        }
    }

    /**
     * Send team addition email
     * @param {Object} user - The user object
     * @param {Object} team - The team object
     * @param {string} role - The user's role in the team
     */
    async sendTeamAdditionEmail(user, team, role) {
        try {
            await this.transporter.sendMail({
                from: `"CodeReview Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `You've been added to team: ${team.name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Team Invitation</h2>
            <p>Hello ${user.firstName},</p>
            <p>You have been added to the team <strong>${team.name}</strong> as a <strong>${role}</strong>.</p>
            <p>${team.description ? `Team description: ${team.description}` : ''}</p>
            <p>You can now collaborate with your team members on various projects.</p>
            <p>Best regards,<br>The CodeReview Team</p>
          </div>
        `
            });
            console.log(`Team addition email sent to ${user.email} for team ${team.name}`);
            return true;
        } catch (error) {
            console.error(`Error sending team addition email to ${user.email}:`, error);
            return false;
        }
    }

    /**
     * Send comment notification email when someone adds a comment or replies to a user's comment
     * @param {Object} recipient - The user receiving the notification
     * @param {Object} commenter - The user who made the comment
     * @param {Object} comment - The comment object
     * @param {Object} project - The project object
     * @param {Object} team - The team object (optional)
     * @param {boolean} isReply - Whether this is a reply to an existing comment
     */
    async sendCommentNotificationEmail(recipient, commenter, comment, project, team = null, isReply = false) {
        try {
            const emailType = isReply ? 'replied to your comment' : 'added a new comment';
            const teamInfo = team ? `in team <strong>${team.name}</strong>` : '';

            let commentContentPreview = comment.content;
            // Truncate long comments
            if (commentContentPreview.length > 200) {
                commentContentPreview = `${commentContentPreview.substring(0, 200)}...`;
            }

            // Format location info if available
            let locationInfo = '';
            if (comment.fileLocation && comment.fileLocation.path) {
                locationInfo = `<p>Location: <code>${comment.fileLocation.path}${comment.fileLocation.line ? `:${comment.fileLocation.line}` : ''
                    }</code></p>`;
            }

            const pullRequestLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project._id}/pull-requests/${comment.pullRequestNumber}`;

            await this.transporter.sendMail({
                from: `"CodeReview Team" <${process.env.EMAIL_USER}>`,
                to: recipient.email,
                subject: `[CodeReview] ${commenter.firstName} ${emailType} on PR #${comment.pullRequestNumber} ${project.name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>Comment Notification</h2>
            <p>Hello ${recipient.firstName},</p>
            <p>
              <strong>${commenter.firstName} ${commenter.lastName}</strong> ${emailType} 
              in project <strong>${project.name}</strong> ${teamInfo}
              on pull request <strong>#${comment.pullRequestNumber}</strong>
            </p>
            
            ${locationInfo}
            
            <div style="background-color: #f7f7f7; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; border-radius: 3px;">
              ${commentContentPreview}
            </div>
            
            <p><a href="${pullRequestLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 3px; display: inline-block;">View on CodeReview</a></p>
            
            <p style="color: #777; font-size: 12px; margin-top: 20px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        `
            });
            console.log(`Comment notification email sent to ${recipient.email}`);
            return true;
        } catch (error) {
            console.error(`Error sending comment notification email to ${recipient.email}:`, error);
            return false;
        }
    }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService; 