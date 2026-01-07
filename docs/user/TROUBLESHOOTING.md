# Troubleshooting Guide

## Common Issues and Solutions

### Generation Issues

#### AI Generation Fails

**Symptoms:**
- Error message during generation
- Request times out
- No response from AI

**Solutions:**

1. **Check Rate Limits**
   - Wait 60 seconds and try again
   - Check `x-rate-limit-remaining` header
   - Reduce generation frequency

2. **Verify API Key**
   - Ensure `GOOGLE_API_KEY` is set in `.env.local`
   - Check key is valid and active
   - Verify key has necessary permissions

3. **Check Request Size**
   - Reduce prompt length
   - Remove unnecessary files
   - Simplify the request

4. **Network Issues**
   - Check internet connection
   - Verify firewall settings
   - Try again later

5. **Server Logs**
   - Check console for error messages
   - Look for `requestId` in error response
   - Review server logs for details

#### Inconsistent Generation Results

**Symptoms:**
- Each generation is very different
- Style not consistent
- Results don't match expectations

**Solutions:**

1. **Use Style Templates**
   - Create and apply a style template
   - Be specific in style prompt
   - Test template before using

2. **Refine Prompts**
   - Be more specific and detailed
   - Include technical details
   - Reference specific elements

3. **Use Workflows**
   - Select appropriate workflow
   - Use subtypes for variations
   - Combine workflow with template

4. **Add Constraints**
   - Specify camera angles
   - Define lighting setup
   - Set color palette
   - Include mood descriptors

#### Generation Too Slow

**Symptoms:**
- Long wait times for results
- Timeouts
- Poor user experience

**Solutions:**

1. **Reduce File Sizes**
   - Compress reference images
   - Trim video/audio files
   - Remove unnecessary files

2. **Simplify Prompts**
   - Use concise language
   - Remove redundant details
   - Focus on key elements

3. **Use Faster Models**
   - `imagen-4.0-generate-001-fast` for images
   - Shorter video durations
   - Reduce resolution if acceptable

4. **Check Server Load**
   - Try during off-peak hours
   - Monitor rate limits
   - Consider server resources

---

### File Upload Issues

#### Upload Fails

**Symptoms:**
- File won't upload
- Error message
- Upload progress stuck

**Solutions:**

1. **Check File Size**
   - Maximum: 100MB (default)
   - Compress large files
   - Split into smaller files

2. **Verify File Type**
   - Check supported formats
   - Convert to supported format
   - Ensure file isn't corrupted

3. **Network Issues**
   - Check internet connection
   - Try wired connection
   - Disable VPN if active

4. **Browser Issues**
   - Clear browser cache
   - Try different browser
   - Disable browser extensions

5. **Server Configuration**
   - Check `MAX_FILE_SIZE_MB` setting
   - Verify disk space available
   - Review server logs

#### File Not Used in Generation

**Symptoms:**
- AI ignores uploaded file
- Results don't reflect reference
- File seems unused

**Solutions:**

1. **Set Correct Purpose**
   - Click file thumbnail
   - Change purpose if wrong
   - Use appropriate purpose type

2. **Reference in Prompt**
   - Explicitly mention the file
   - Describe what to use from it
   - Be specific about application

3. **Check File Quality**
   - Ensure high resolution
   - Verify file isn't corrupted
   - Use clear, relevant images

4. **File Order**
   - Move important files to top
   - Reorder by priority
   - Remove conflicting files

#### Slow Upload

**Symptoms:**
- Upload takes very long
- Progress bar moves slowly
- Timeout errors

**Solutions:**

1. **Optimize File Size**
   - Compress before uploading
   - Reduce resolution
   - Use efficient formats (JPEG, MP3)

2. **Network Optimization**
   - Use wired connection
   - Close other applications
   - Upload during off-peak hours

3. **File Routing**
   - Files >20MB use Files API (slower)
   - Video/audio always use Files API
   - Consider splitting large files

---

### Workflow Issues

#### Workflow Not Working

**Symptoms:**
- AI doesn't follow workflow instructions
- Results are generic
- No difference from default

**Solutions:**

1. **Verify Selection**
   - Check workflow is selected
   - Ensure not using "Simple Chat"
   - Verify subtype if applicable

2. **Improve Instructions**
   - Be more specific and directive
   - Use clear, unambiguous language
   - Add examples
   - Include constraints

3. **Test Workflow**
   - Create test project
   - Try simple prompts first
   - Verify behavior
   - Refine instructions

4. **Check Conflicts**
   - Ensure no contradictions
   - Verify subtype compatibility
   - Remove conflicting elements

#### Subtype Not Applied

**Symptoms:**
- Subtype selection has no effect
- Results same as base workflow
- No variation visible

**Solutions:**

1. **Strengthen Modifier**
   - Use more directive language
   - Add specific examples
   - Include technical details
   - Be more prescriptive

2. **Avoid Conflicts**
   - Ensure modifier doesn't contradict base
   - Check for conflicting instructions
   - Test modifier independently

3. **Verify Selection**
   - Confirm subtype is selected
   - Check dropdown shows subtype
   - Try different subtype

---

### Template Issues

#### Template Not Applied

**Symptoms:**
- Generated images don't show style
- Results look generic
- Style not visible

**Solutions:**

1. **Verify Selection**
   - Check template is active
   - Confirm in settings
   - Look for active indicator

2. **Strengthen Style Prompt**
   - Be more specific
   - Add technical details
   - Use stronger language
   - Include more descriptors

3. **Test Template**
   - Generate multiple images
   - Try different subjects
   - Verify consistency
   - Refine style prompt

4. **Check Compatibility**
   - Ensure style works with subject
   - Avoid conflicting elements
   - Test with simple prompts

#### Style Too Strong

**Symptoms:**
- Style overwhelms subject
- Results too stylized
- Subject not recognizable

**Solutions:**

1. **Reduce Style Intensity**
   - Remove excessive descriptors
   - Use more subtle language
   - Balance style with subject

2. **Adjust Prompt**
   - Emphasize subject more
   - Reduce style references
   - Find balance

3. **Create Variation**
   - Make lighter version of template
   - Use as separate template
   - Test with different subjects

---

### Document Issues

#### Auto-Save Not Working

**Symptoms:**
- Changes not saved
- Document reverts
- Loss of edits

**Solutions:**

1. **Check Connection**
   - Verify internet connection
   - Check server status
   - Review browser console

2. **Manual Save**
   - Click save button manually
   - Wait for confirmation
   - Verify save succeeded

3. **Browser Issues**
   - Clear browser cache
   - Try different browser
   - Disable extensions

4. **Server Issues**
   - Check server logs
   - Verify database connection
   - Review error messages

#### Version History Missing

**Symptoms:**
- No version history shown
- Can't restore previous versions
- History empty

**Solutions:**

1. **Check Document Exists**
   - Verify document was saved
   - Ensure project has document
   - Check database

2. **Version Limit**
   - Only last 10 versions kept
   - Older versions pruned
   - Expected behavior

3. **Database Issues**
   - Check database integrity
   - Review migration status
   - Verify table structure

#### Export Fails

**Symptoms:**
- Export doesn't download
- Error during export
- Corrupted export file

**Solutions:**

1. **Check Format**
   - Try different format
   - Verify format support
   - Check file size

2. **Browser Issues**
   - Allow downloads in browser
   - Check download location
   - Try different browser

3. **Content Issues**
   - Verify document content
   - Check for special characters
   - Simplify content

4. **Server Issues**
   - Check server logs
   - Verify export service
   - Review error messages

---

### Streaming Chat Issues

#### Stream Disconnects

**Symptoms:**
- Chat stops mid-response
- Connection lost
- Incomplete responses

**Solutions:**

1. **Network Stability**
   - Use wired connection
   - Check network stability
   - Disable VPN if active

2. **Browser Issues**
   - Try different browser
   - Clear browser cache
   - Update browser

3. **Server Issues**
   - Check server logs
   - Verify SSE support
   - Review timeout settings

4. **Implement Reconnection**
   - Automatic reconnection
   - Resume from last token
   - Handle errors gracefully

#### Stop Generation Not Working

**Symptoms:**
- Can't stop generation
- Button doesn't work
- Generation continues

**Solutions:**

1. **Close Connection**
   - Refresh page
   - Close browser tab
   - Restart application

2. **Check Implementation**
   - Verify stop button wired
   - Check connection close
   - Review event handling

3. **Server-Side**
   - Verify cleanup logic
   - Check connection tracking
   - Review server logs

---

### Performance Issues

#### Slow Application

**Symptoms:**
- UI is sluggish
- Long load times
- Unresponsive interface

**Solutions:**

1. **Browser Optimization**
   - Close unused tabs
   - Clear browser cache
   - Disable extensions
   - Update browser

2. **Reduce Data**
   - Delete unused projects
   - Remove old assets
   - Clean up files
   - Archive completed projects

3. **Database Optimization**
   - Run database maintenance
   - Check database size
   - Optimize queries
   - Review indexes

4. **Server Resources**
   - Check CPU usage
   - Monitor memory
   - Review disk space
   - Optimize configuration

#### High Memory Usage

**Symptoms:**
- Browser uses lots of memory
- System slows down
- Crashes or freezes

**Solutions:**

1. **Close Unused Projects**
   - Work on one project at a time
   - Close other tabs
   - Restart browser periodically

2. **Optimize Assets**
   - Compress images
   - Remove unused files
   - Limit file sizes
   - Clean up regularly

3. **Browser Settings**
   - Disable hardware acceleration
   - Clear cache regularly
   - Limit extensions
   - Update browser

---

### Database Issues

#### Database Locked

**Symptoms:**
- "Database is locked" error
- Operations fail
- Timeouts

**Solutions:**

1. **Close Connections**
   - Stop all processes
   - Restart server
   - Check for zombie processes

2. **Check Concurrent Access**
   - Limit concurrent operations
   - Use connection pooling
   - Review transaction handling

3. **Database Maintenance**
   - Run VACUUM
   - Check integrity
   - Optimize database

#### Migration Fails

**Symptoms:**
- Migration errors
- Database schema wrong
- Missing tables

**Solutions:**

1. **Check Migration Files**
   - Verify SQL syntax
   - Check file order
   - Review dependencies

2. **Manual Migration**
   - Run migrations manually
   - Check each step
   - Verify results

3. **Reset Database**
   - Backup data first
   - Delete database file
   - Run migrations fresh
   - Restore data if needed

---

### API Issues

#### Rate Limit Exceeded

**Symptoms:**
- 429 error responses
- "Too many requests" message
- Blocked requests

**Solutions:**

1. **Wait and Retry**
   - Check `Retry-After` header
   - Wait specified time
   - Implement exponential backoff

2. **Reduce Frequency**
   - Batch operations
   - Cache responses
   - Limit concurrent requests

3. **Increase Limits**
   - Adjust `AI_RATE_LIMIT_MAX_REQUESTS`
   - Modify `AI_RATE_LIMIT_WINDOW_MS`
   - Review configuration

#### Request ID Missing

**Symptoms:**
- No `requestId` in response
- Can't track requests
- Debugging difficult

**Solutions:**

1. **Check Headers**
   - Look for `x-request-id` header
   - Verify server sends it
   - Check response format

2. **Server Configuration**
   - Verify middleware
   - Check error handling
   - Review response format

3. **Client Implementation**
   - Extract from headers
   - Store for debugging
   - Include in error reports

---

## Error Codes Reference

### Client Errors (4xx)

| Code                  | Status | Description             | Action                  |
| --------------------- | ------ | ----------------------- | ----------------------- |
| `VALIDATION_FAILED`   | 400    | Invalid request payload | Fix request format      |
| `FILE_MISSING`        | 400    | No file in upload       | Include file in request |
| `PROJECT_NOT_FOUND`   | 404    | Project doesn't exist   | Verify project ID       |
| `SCENE_NOT_FOUND`     | 404    | Scene doesn't exist     | Verify scene ID         |
| `FILE_NOT_FOUND`      | 404    | File doesn't exist      | Verify file ID          |
| `RATE_LIMIT_EXCEEDED` | 429    | Too many requests       | Wait and retry          |

### Server Errors (5xx)

| Code                   | Status | Description       | Action            |
| ---------------------- | ------ | ----------------- | ----------------- |
| `UPLOAD_FAILED`        | 500    | File upload error | Retry upload      |
| `AI_GENERATION_FAILED` | 500    | AI service error  | Retry generation  |
| `INTERNAL_ERROR`       | 500    | Unexpected error  | Check logs, retry |

## Getting Help

### Before Requesting Support

1. **Check this guide** for solutions
2. **Review error messages** carefully
3. **Check server logs** for details
4. **Note the `requestId`** from errors
5. **Try basic troubleshooting** first

### Information to Include

When requesting support, provide:

- **Request ID** from error response
- **Error message** (full text)
- **Steps to reproduce** the issue
- **Expected behavior** vs actual
- **Browser and version**
- **Operating system**
- **Screenshots** if applicable
- **Server logs** (sanitized)

### Where to Get Help

- **Documentation**: Check all docs first
- **GitHub Issues**: Search existing issues
- **Community Forum**: Ask the community
- **Support Email**: For urgent issues

## Preventive Measures

### Regular Maintenance

1. **Clean up files** regularly
2. **Delete unused projects**
3. **Archive completed work**
4. **Update dependencies**
5. **Review logs** periodically

### Best Practices

1. **Save work frequently**
2. **Export important projects**
3. **Test before production**
4. **Monitor rate limits**
5. **Keep backups**

### Monitoring

1. **Check error rates**
2. **Monitor performance**
3. **Review logs regularly**
4. **Track API usage**
5. **Watch disk space**

## Resources

- [API Documentation](../API.md) - Technical details
- [Configuration Guide](../CONFIGURATION.md) - Setup and config
- [Architecture Documentation](../ARCHITECTURE.md) - System design
- [Workflow Guide](./WORKFLOWS.md) - Workflow management
- [Template Guide](./TEMPLATES.md) - Style templates
- [File Upload Guide](./FILE-UPLOADS.md) - File handling

## Feedback

Help us improve this guide:
- Report issues you encounter
- Suggest additional solutions
- Share what worked for you
- Contribute to documentation

Happy troubleshooting! 🔧
