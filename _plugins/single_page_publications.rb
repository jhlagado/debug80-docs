require "pathname"
require "yaml"

module SinglePagePublications
  FRONT_MATTER = /\A---\s*\n(.*?)\n---\s*\n/m
  MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/

  class ReaderPage < Jekyll::Page
    def initialize(site, publication, content)
      @site = site
      @base = site.source
      @dir = File.join(publication.fetch("root"), "single-page")
      @name = "index.md"

      process(@name)
      read_yaml(File.join(site.source, "_layouts"), "reader.html")
      data["layout"] = "reader"
      data["title"] = "#{publication.fetch("title")} - Single-page reader"
      data["publication_title"] = publication.fetch("title")
      data["description"] = publication["description"]
      self.content = content
    end
  end

  class Generator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      Array(site.data["publications"]).each do |publication|
        site.pages << ReaderPage.new(site, publication, reader_content(site, publication))
      end
    end

    private

    def reader_content(site, publication)
      root = publication.fetch("root")
      files = ordered_markdown_files(site, root)
      anchors = anchor_map(site, files)
      toc = files.map { |file| toc_item(site, file, anchors.fetch(file)) }.join("\n")
      body = files.map { |file| chapter_content(site, file, anchors) }.join("\n\n")

      <<~MARKDOWN
        > Single-page reader version. [Return to #{publication.fetch("title")}](../).

        ## Contents

        #{toc}

        ---

        #{body}
      MARKDOWN
    end

    def ordered_markdown_files(site, root)
      root_path = File.join(site.source, root)
      files = Dir.glob(File.join(root_path, "**", "*.md"))
      metadata = files.to_h { |file| [file, front_matter(file)] }
      root_file = File.join(root_path, "index.md")
      children = Hash.new { |hash, key| hash[key] = [] }

      files.each do |file|
        next if file == root_file

        parent_file = parent_for(file, metadata, root_path)
        children[parent_file] << file
      end

      walk_order(root_file, children, metadata)
    end

    def parent_for(file, metadata, root_path)
      data = metadata.fetch(file)
      dir = File.dirname(file)
      title = data["title"]
      parent = data["parent"]
      grand_parent = data["grand_parent"]

      dir_index = File.join(dir, "index.md")
      return dir_index if dir_index != file && File.exist?(dir_index) && !grand_parent && parent && title != parent

      candidates = metadata.select do |candidate, candidate_data|
        candidate_data["title"] == parent && candidate != file
      end.keys

      candidates.find { |candidate| File.dirname(file).start_with?(File.dirname(candidate)) } ||
        candidates.first ||
        File.join(root_path, "index.md")
    end

    def walk_order(file, children, metadata)
      [file] + children[file].sort_by { |child| sort_key(child, metadata) }.flat_map do |child|
        walk_order(child, children, metadata)
      end
    end

    def sort_key(file, metadata)
      data = metadata.fetch(file)
      [data.fetch("nav_order", 999).to_i, File.basename(file)]
    end

    def front_matter(file)
      match = File.read(file).match(FRONT_MATTER)
      match ? YAML.safe_load(match[1], permitted_classes: [Date], aliases: true) || {} : {}
    end

    def anchor_map(site, files)
      files.to_h do |file|
        relative = relative_path(site, file).sub(/\.md\z/, "").sub(%r{/index\z}, "")
        [file, "reader-#{Jekyll::Utils.slugify(relative, mode: "pretty")}"]
      end
    end

    def toc_item(site, file, anchor)
      data = front_matter(file)
      depth = relative_path(site, file).count("/")
      indent = "  " * depth
      "#{indent}- [#{data.fetch("title", File.basename(file, ".md"))}](##{anchor})"
    end

    def chapter_content(site, file, anchors)
      data = front_matter(file)
      body = File.read(file).sub(FRONT_MATTER, "")
      body = strip_navigation_rows(body)
      body = remove_first_heading(body)
      body = rewrite_links(site, file, body, anchors)
      title = data.fetch("title", File.basename(file, ".md"))
      anchor = anchors.fetch(file)

      <<~MARKDOWN
        <section id="#{anchor}" class="reader-section">

        ## #{title}

        #{body.strip}

        </section>
      MARKDOWN
    end

    def strip_navigation_rows(body)
      lines = body.lines
      lines.shift while lines.first&.strip == ""
      lines.shift if navigation_row?(lines.first)
      lines.pop while lines.last&.strip == ""
      lines.pop if navigation_row?(lines.last)
      lines.join
    end

    def remove_first_heading(body)
      lines = body.lines
      heading_index = lines.index { |line| line.start_with?("# ") }
      lines.delete_at(heading_index) if heading_index
      lines.join
    end

    def navigation_row?(line)
      return false unless line

      text = line.strip
      text.start_with?("[") && text.include?("](") && (text.include?(" | ") || text.include?("←") || text.include?("→"))
    end

    def rewrite_links(site, file, body, anchors)
      body.gsub(MARKDOWN_LINK) do
        label = Regexp.last_match(1)
        target = Regexp.last_match(2)
        rewritten = rewrite_target(site, file, target, anchors)
        "[#{label}](#{rewritten})"
      end
    end

    def rewrite_target(site, file, target, anchors)
      return target if target.match?(%r{\A[a-z][a-z0-9+.-]*:}i) || target.start_with?("#")

      path, fragment = target.split("#", 2)
      return target unless path.end_with?(".md") || path.end_with?("README.md") || path.end_with?("/")

      resolved = File.expand_path(path.end_with?("/") ? File.join(path, "index.md") : path, File.dirname(file))
      resolved = resolved.sub(%r{/README\.md\z}, "/index.md")
      anchor = anchors[resolved]
      return target unless anchor

      fragment && !fragment.empty? ? "##{anchor}" : "##{anchor}"
    end

    def relative_path(site, file)
      Pathname.new(file).relative_path_from(Pathname.new(site.source)).to_s
    end
  end
end
