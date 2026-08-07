with open('documentController.js', 'r') as f:
    content = f.read()

# Fix 1: Make dealId optional
old1 = """const { dealId } = req.body
 if (!dealId) return res.status(400).json({ error: 'dealId required' })

 const deal = await prisma.deal.findUnique({ where: { id: dealId } })
 if (!deal) return res.status(404).json({ error: 'Deal not found' })"""
new1 = """const { dealId } = req.body
 let deal = null
 if (dealId) {
   deal = await prisma.deal.findUnique({ where: { id: dealId } })
   if (!deal) return res.status(404).json({ error: 'Deal not found' })
 }"""
content = content.replace(old1, new1)

# Fix 2: Make dealId optional in prisma document create
old2 = "dealId,"
new2 = "dealId: dealId || null,"
content = content.replace(old2, new2)

# Fix 3: Make folder creation conditional
old3 = """const folderName = getFolderLabel(result.category)
 let folder = await prisma.folder.findUnique({
 where: { dealId_name: { dealId, name: folderName } }
 })
 if (!folder) {
 folder = await prisma.folder.create({
 data: { name: folderName, dealId, createdBy: req.user.id }
 })
 }
 await prisma.document.update({ where: { id: doc.id }, data: { folderId: folder.id } })"""
new3 = """if (dealId) {
   const folderName = getFolderLabel(result.category)
   let folder = await prisma.folder.findUnique({
     where: { dealId_name: { dealId, name: folderName } }
   })
   if (!folder) {
     folder = await prisma.folder.create({
       data: { name: folderName, dealId, createdBy: req.user.id }
     })
   }
   await prisma.document.update({ where: { id: doc.id }, data: { folderId: folder.id } })
 }"""
content = content.replace(old3, new3)

with open('documentController.js', 'w') as f:
    f.write(content)

print('Done!')
